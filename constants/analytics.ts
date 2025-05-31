export const ANALYTICS_METRICS = {
  TOTAL_IMPRESSIONS: {
    label: "총 노출수",
    value: "1,234,567",
    change: "+12.5%",
  },
  TOTAL_CLICKS: { label: "총 클릭수", value: "45,678", change: "+8.3%" },
  AVERAGE_CTR: {
    label: "평균 CTR",
    value: "3.7%",
    change: "-0.2%",
    isNegative: true,
  },
  TOTAL_CONVERSIONS: { label: "총 전환수", value: "1,234", change: "+15.7%" },
} as const;

export const KEY_METRICS = [
  { label: "평균 CPC", value: "₩234" },
  { label: "평균 CPM", value: "₩5,678" },
  { label: "ROAS", value: "320%" },
  { label: "총 지출", value: "₩12,345,678" },
] as const;

export const CHART_OPTIONS = {
  LINE_CHART: {
    title: {
      text: "월별 광고 실적",
    },
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["노출수", "클릭수", "전환수"],
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: ["1월", "2월", "3월", "4월", "5월", "6월"],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "노출수",
        type: "line",
        data: [120000, 132000, 101000, 134000, 90000, 230000],
      },
      {
        name: "클릭수",
        type: "line",
        data: [2200, 1820, 1910, 2340, 2900, 3300],
      },
      {
        name: "전환수",
        type: "line",
        data: [150, 232, 201, 154, 190, 330],
      },
    ],
  },
  BAR_CHART: {
    title: {
      text: "채널별 성과",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {},
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
    },
    yAxis: {
      type: "category",
      data: ["Google Ads", "Facebook", "Instagram", "Naver", "Kakao"],
    },
    series: [
      {
        name: "클릭수",
        type: "bar",
        data: [18203, 23489, 29034, 104970, 131744],
      },
    ],
  },
  PIE_CHART: {
    title: {
      text: "예산 분배",
      left: "center",
    },
    tooltip: {
      trigger: "item",
    },
    legend: {
      orient: "vertical",
      left: "left",
    },
    series: [
      {
        name: "예산",
        type: "pie",
        radius: "50%",
        data: [
          { value: 1048, name: "Google Ads" },
          { value: 735, name: "Facebook" },
          { value: 580, name: "Instagram" },
          { value: 484, name: "Naver" },
          { value: 300, name: "Kakao" },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  },
} as const;
