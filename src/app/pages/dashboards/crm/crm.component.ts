import { Component, OnInit } from '@angular/core';

interface DashboardMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  helper: string;
  icon: string;
  tone: 'success' | 'primary' | 'warning' | 'danger';
}

interface CollectionRoute {
  route: string;
  area: string;
  driver: string;
  vehicle: string;
  completedStops: number;
  totalStops: number;
  tonnage: number;
  status: 'Completed' | 'In progress' | 'Delayed' | 'Not started';
}

interface OperationsAlert {
  title: string;
  detail: string;
  time: string;
  icon: string;
  tone: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-crm',
  templateUrl: './crm.component.html',
  styleUrls: ['./crm.component.scss'],
  standalone: false
})
export class CrmComponent implements OnInit {
  breadCrumbItems: Array<{ label: string; active?: boolean }> = [];

  readonly snapshotLabel = 'Demo operational snapshot';
  readonly reportingPeriod = '29 July 2026';

  readonly metrics: DashboardMetric[] = [
    {
      label: 'Waste collected today',
      value: '48.6 t',
      change: '12.4%',
      trend: 'up',
      helper: '5.4 t above yesterday',
      icon: 'ri-scales-3-line',
      tone: 'success'
    },
    {
      label: 'Collection completion',
      value: '87.5%',
      change: '4.8%',
      trend: 'up',
      helper: '140 of 160 pickups',
      icon: 'ri-checkbox-circle-line',
      tone: 'primary'
    },
    {
      label: 'Active routes',
      value: '18 / 22',
      change: '2 routes',
      trend: 'up',
      helper: '4 routes completed',
      icon: 'ri-route-line',
      tone: 'warning'
    },
    {
      label: 'Missed or overdue',
      value: '14',
      change: '3.1%',
      trend: 'down',
      helper: '6 require dispatch action',
      icon: 'ri-alarm-warning-line',
      tone: 'danger'
    }
  ];

  readonly collectionTrendChart: any = {
    series: [
      { name: 'Collected', data: [39.2, 43.8, 41.6, 47.1, 45.4, 50.2, 48.6] },
      { name: 'Target', data: [44, 44, 45, 46, 47, 49, 50] }
    ],
    chart: {
      type: 'area',
      height: 330,
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ['#0ab39c', '#405189'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: [3, 2], dashArray: [0, 5] },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.32,
        opacityTo: 0.04,
        stops: [0, 90, 100]
      }
    },
    markers: { size: 0, hover: { sizeOffset: 4 } },
    xaxis: {
      categories: ['Wed 23', 'Thu 24', 'Fri 25', 'Sat 26', 'Sun 27', 'Mon 28', 'Tue 29'],
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      min: 0,
      tickAmount: 5,
      labels: { formatter: (value: number) => `${value.toFixed(0)} t` }
    },
    grid: { borderColor: '#e9ebec', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'right' },
    tooltip: { y: { formatter: (value: number) => `${value.toFixed(1)} tonnes` } }
  };

  readonly collectionStatusChart: any = {
    series: [126, 18, 9, 7],
    labels: ['Completed', 'In progress', 'Missed', 'Rescheduled'],
    chart: { type: 'donut', height: 300 },
    colors: ['#0ab39c', '#299cdb', '#f06548', '#f7b84b'],
    dataLabels: { enabled: false },
    legend: { position: 'bottom', horizontalAlign: 'center' },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: { show: true },
            value: { show: true, fontSize: '24px', fontWeight: 600 },
            total: {
              show: true,
              label: 'Scheduled',
              formatter: () => '160'
            }
          }
        }
      }
    },
    tooltip: { y: { formatter: (value: number) => `${value} pickups` } }
  };

  readonly routePerformanceChart: any = {
    series: [{
      name: 'Stops completed',
      data: [96, 92, 88, 84, 76, 63]
    }],
    chart: { type: 'bar', height: 325, toolbar: { show: false } },
    colors: ['#0ab39c'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 5,
        barHeight: '56%',
        distributed: true
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (value: number) => `${value}%`,
      style: { colors: ['#fff'] }
    },
    xaxis: {
      categories: ['Kampala Central', 'Nakawa East', 'Makindye South', 'Rubaga North', 'Kawempe West', 'Entebbe Road'],
      max: 100,
      labels: { formatter: (value: number) => `${value}%` }
    },
    grid: { borderColor: '#e9ebec', strokeDashArray: 4 },
    legend: { show: false },
    tooltip: { y: { formatter: (value: number) => `${value}% completed` } }
  };

  readonly wasteCompositionChart: any = {
    series: [42, 24, 16, 8, 10],
    labels: ['Organic', 'Plastic', 'Paper', 'Glass & metal', 'Other'],
    chart: { type: 'donut', height: 305 },
    colors: ['#0ab39c', '#299cdb', '#f7b84b', '#405189', '#878a99'],
    dataLabels: { enabled: true, formatter: (value: number) => `${value.toFixed(0)}%` },
    legend: { position: 'bottom' },
    stroke: { width: 2, colors: ['var(--vz-card-bg)'] },
    plotOptions: { pie: { donut: { size: '58%' } } },
    tooltip: { y: { formatter: (value: number) => `${value}% of collected waste` } }
  };

  readonly routes: CollectionRoute[] = [
    { route: 'RT-001', area: 'Kampala Central', driver: 'Moses Kato', vehicle: 'UBK 241D', completedStops: 24, totalStops: 25, tonnage: 7.8, status: 'In progress' },
    { route: 'RT-004', area: 'Nakawa East', driver: 'Sarah Nambooze', vehicle: 'UBM 904Q', completedStops: 23, totalStops: 25, tonnage: 6.9, status: 'In progress' },
    { route: 'RT-008', area: 'Makindye South', driver: 'David Ochieng', vehicle: 'UBH 118P', completedStops: 22, totalStops: 25, tonnage: 7.2, status: 'Completed' },
    { route: 'RT-011', area: 'Rubaga North', driver: 'Peter Mugisha', vehicle: 'UBN 660A', completedStops: 21, totalStops: 25, tonnage: 6.4, status: 'In progress' },
    { route: 'RT-016', area: 'Kawempe West', driver: 'Grace Namuli', vehicle: 'UBJ 528C', completedStops: 19, totalStops: 25, tonnage: 5.8, status: 'Delayed' },
    { route: 'RT-021', area: 'Entebbe Road', driver: 'Ivan Ssekandi', vehicle: 'UBP 307E', completedStops: 0, totalStops: 18, tonnage: 0, status: 'Not started' }
  ];

  readonly alerts: OperationsAlert[] = [
    {
      title: 'Vehicle UBJ 528C reported a hydraulic fault',
      detail: 'RT-016 · Kawempe West · replacement truck requested',
      time: '12 min ago',
      icon: 'ri-truck-line',
      tone: 'danger'
    },
    {
      title: 'Six overdue commercial pickups',
      detail: 'Nakawa industrial area · dispatch review required',
      time: '26 min ago',
      icon: 'ri-timer-flash-line',
      tone: 'warning'
    },
    {
      title: 'Landfill queue is above 35 minutes',
      detail: 'Kiteezi transfer point · routes RT-001 and RT-004 affected',
      time: '41 min ago',
      icon: 'ri-road-map-line',
      tone: 'warning'
    },
    {
      title: 'Adhoc hospital pickup approved',
      detail: 'Muyenga Medical Centre · assigned to RT-008',
      time: '1 hr ago',
      icon: 'ri-add-circle-line',
      tone: 'info'
    }
  ];

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Dashboard' },
      { label: 'Waste Collection Overview', active: true }
    ];
  }

  routeProgress(route: CollectionRoute): number {
    if (!route.totalStops) {
      return 0;
    }

    return Math.round((route.completedStops / route.totalStops) * 100);
  }

  statusClass(status: CollectionRoute['status']): string {
    const classes: Record<CollectionRoute['status'], string> = {
      Completed: 'bg-success-subtle text-success',
      'In progress': 'bg-info-subtle text-info',
      Delayed: 'bg-warning-subtle text-warning',
      'Not started': 'bg-secondary-subtle text-secondary'
    };

    return classes[status];
  }
}
