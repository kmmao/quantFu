'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, IChartApi } from 'lightweight-charts'

interface KLineData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface Marker {
  time: number
  position: 'aboveBar' | 'belowBar'
  color: string
  shape: 'arrowUp' | 'arrowDown' | 'circle' | 'square'
  text: string
  size?: number
}

interface KLineChartProps {
  data: KLineData[]
  markers?: Marker[]
  height?: number
}

export default function KLineChart({ data, markers = [], height = 400 }: KLineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const candlestickSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return

    // 创建图表
    const chart: any = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'white' },
        textColor: '#333',
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#ddd',
      },
      timeScale: {
        borderColor: '#ddd',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // 创建K线系列
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    candlestickSeriesRef.current = candlestickSeries

    // 创建成交量系列
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    })

    volumeSeriesRef.current = volumeSeries

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    // 设置数据
    candlestickSeries.setData(data)

    // 设置成交量数据
    const volumeData = data.map(d => ({
      time: d.time,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
    }))
    volumeSeries.setData(volumeData)

    // 设置标记
    if (markers.length > 0) {
      candlestickSeries.setMarkers(markers)
    }

    // 自适应大小
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // 清理
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data, markers, height])

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <p className="text-gray-500">暂无K线数据</p>
      </div>
    )
  }

  return <div ref={chartContainerRef} className="rounded-lg border" />
}
