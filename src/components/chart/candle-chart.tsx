'use client'

/**
 * 캔들 차트 컴포넌트 (dynamic import 전용, SSR 불가)
 *
 * lightweight-charts v5를 사용하여 캔들스틱 차트와 거래량 히스토그램을 렌더링합니다.
 * 반드시 dynamic(() => import('./candle-chart'), { ssr: false })로 로드해야 합니다.
 *
 * 주요 기능:
 * - 캔들스틱 차트: 상승=빨강, 하락=파랑 (한국 관례)
 * - 거래량 히스토그램: 하단 영역에 표시
 * - ResizeObserver로 컨테이너 크기 변화 감지 → 차트 자동 리사이즈
 * - 다크/라이트 모드 대응
 * - 언마운트 시 chart.remove()로 정리
 */

import { useRef, useEffect, useCallback } from 'react'
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
  type CandlestickData,
  type HistogramData,
} from 'lightweight-charts'
import type { UpbitCandle } from '@/types/upbit'

interface CandleChartProps {
  /** 캔들 데이터 (UpbitCandle[]) */
  data: UpbitCandle[]
}

/** 다크 모드 여부 감지 */
function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

/** 테마별 차트 옵션 */
function getThemeColors(dark: boolean) {
  return {
    background: dark ? '#09090b' : '#ffffff',
    textColor: dark ? '#a1a1aa' : '#71717a',
    gridColor: dark ? '#27272a' : '#f4f4f5',
    borderColor: dark ? '#3f3f46' : '#e4e4e7',
  }
}

/** UpbitCandle → lightweight-charts CandlestickData 변환 */
function toCandlestickData(candles: UpbitCandle[]): CandlestickData<UTCTimestamp>[] {
  return candles
    .map((c) => ({
      time: Math.floor(new Date(c.candle_date_time_utc + 'Z').getTime() / 1000) as UTCTimestamp,
      open: c.opening_price,
      high: c.high_price,
      low: c.low_price,
      close: c.trade_price,
    }))
    .sort((a, b) => (a.time as number) - (b.time as number))
}

/** UpbitCandle → lightweight-charts HistogramData 변환 (거래량) */
function toVolumeData(candles: UpbitCandle[]): HistogramData<UTCTimestamp>[] {
  return candles
    .map((c) => ({
      time: Math.floor(new Date(c.candle_date_time_utc + 'Z').getTime() / 1000) as UTCTimestamp,
      value: c.candle_acc_trade_volume,
      /* 상승=빨강, 하락=파랑 */
      color: c.trade_price >= c.opening_price
        ? 'rgba(239, 68, 68, 0.5)'
        : 'rgba(59, 130, 246, 0.5)',
    }))
    .sort((a, b) => (a.time as number) - (b.time as number))
}

export default function CandleChart({ data }: CandleChartProps) {
  /** 차트 컨테이너 DOM 참조 */
  const containerRef = useRef<HTMLDivElement>(null)
  /** lightweight-charts 인스턴스 */
  const chartRef = useRef<IChartApi | null>(null)
  /** 캔들스틱 시리즈 참조 */
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick', Time> | null>(null)
  /** 거래량 히스토그램 시리즈 참조 */
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram', Time> | null>(null)

  /**
   * 차트 초기화
   * 컨테이너에 차트를 생성하고 캔들스틱 + 거래량 시리즈를 추가합니다.
   */
  const initChart = useCallback(() => {
    if (!containerRef.current) return

    const dark = isDarkMode()
    const theme = getThemeColors(dark)

    /* 차트 생성 */
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { color: theme.background },
        textColor: theme.textColor,
      },
      grid: {
        vertLines: { color: theme.gridColor },
        horzLines: { color: theme.gridColor },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: theme.borderColor,
      },
      rightPriceScale: {
        borderColor: theme.borderColor,
      },
      crosshair: {
        mode: 0, /* Normal */
      },
    })

    /* 캔들스틱 시리즈 (한국 관례: 상승=빨강, 하락=파랑) */
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#ef4444',
      downColor: '#3b82f6',
      borderUpColor: '#ef4444',
      borderDownColor: '#3b82f6',
      wickUpColor: '#ef4444',
      wickDownColor: '#3b82f6',
    })

    /* 거래량 히스토그램 시리즈 (별도 가격 축, 하단 20% 영역) */
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })

    /* 거래량 가격 축 설정 (하단 20% 차지) */
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries
  }, [])

  /**
   * 차트 초기화 및 ResizeObserver, 다크모드 MutationObserver 설정
   */
  useEffect(() => {
    initChart()

    const container = containerRef.current
    if (!container || !chartRef.current) return

    /* ResizeObserver로 컨테이너 크기 변화 감지 */
    const resizeObserver = new ResizeObserver((entries) => {
      if (!chartRef.current) return
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        chartRef.current.resize(width, height)
      }
    })
    resizeObserver.observe(container)

    /* 다크 모드 변경 감지 (html 요소의 class 변경 감시) */
    const mutationObserver = new MutationObserver(() => {
      if (!chartRef.current) return
      const dark = isDarkMode()
      const theme = getThemeColors(dark)
      chartRef.current.applyOptions({
        layout: {
          background: { color: theme.background },
          textColor: theme.textColor,
        },
        grid: {
          vertLines: { color: theme.gridColor },
          horzLines: { color: theme.gridColor },
        },
        timeScale: {
          borderColor: theme.borderColor,
        },
        rightPriceScale: {
          borderColor: theme.borderColor,
        },
      })
    })
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    /* Cleanup: 언마운트 시 차트 제거 */
    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        candleSeriesRef.current = null
        volumeSeriesRef.current = null
      }
    }
  }, [initChart])

  /**
   * 데이터 변경 시 시리즈 업데이트
   */
  useEffect(() => {
    if (!data || data.length === 0) return
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return

    const candlestickData = toCandlestickData(data)
    const volumeData = toVolumeData(data)

    candleSeriesRef.current.setData(candlestickData)
    volumeSeriesRef.current.setData(volumeData)

    /* 최신 데이터가 보이도록 스크롤 */
    chartRef.current?.timeScale().fitContent()
  }, [data])

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[400px]"
    />
  )
}
