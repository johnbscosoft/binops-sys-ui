import { MenuItem } from './menu.model';

const menu = (id: number, label: string, icon: string, basePath: string, children: Array<[string, string]>): MenuItem => ({
  id,
  label,
  icon,
  isCollapsed: true,
  subItems: children.map(([childLabel, childPath], index) => ({
    id: id * 100 + index + 1,
    label: childLabel,
    link: `${basePath}/${childPath}`,
    parentId: id
  }))
});

export const MENU: MenuItem[] = [
  {
    id: 1,
    label: 'WASTEOPS',
    isTitle: true
  },
  menu(10, 'Dashboard', 'ri-dashboard-2-line', '/dashboard', [
    ['Overview', 'overview'],
    ['Key Metrics', 'key-metrics']
  ]),
  menu(20, 'Customer Management', 'ri-user-3-line', '/customers', [
    ['Customers', 'list'],
    ['Customer Details', 'details'],
    ['Customer Contracts', 'contracts'],
    ['Customer Locations', 'locations'],
    ['QR Codes', 'qr-codes']
  ]),
  menu(30, 'Subscriptions', 'ri-repeat-2-line', '/subscriptions', [
    ['Active Subscriptions', 'active'],
    ['Expiring Subscriptions', 'expiring'],
    ['Subscription Plans', 'plans'],
    ['Renewal History', 'renewal-history']
  ]),
  menu(40, 'Waste Collection Operations', 'ri-recycle-line', '/collections', [
    ['Collection Schedule', 'schedule'],
    ['Collection Routes', 'routes'],
    ['Collection Assignments', 'assignments'],
    ['Adhoc Pickup Requests', 'adhoc-pickups'],
    ['Collection History', 'history']
  ]),
  menu(50, 'Finance', 'ri-money-dollar-circle-line', '/finance', [
    ['Payments', 'payments'],
    ['Invoices', 'invoices'],
    ['Outstanding Balances', 'outstanding-balances'],
    ['Revenue Tracking', 'revenue-tracking'],
    ['Payment History', 'payment-history']
  ]),
  menu(60, 'Fleet Management', 'ri-truck-line', '/vehicles', [
    ['Vehicles', 'list'],
    ['Vehicle Maintenance', 'maintenance'],
    ['Fuel Tracking', 'fuel-tracking'],
    ['Driver Assignments', 'driver-assignments']
  ]),
  menu(70, 'Human Resource', 'ri-team-line', '/staff', [
    ['Staff Management', 'management'],
    ['Drivers', 'drivers'],
    ['Attendance', 'attendance'],
    ['Leave Management', 'leave-management']
  ]),
  menu(80, 'Reports', 'ri-file-chart-line', '/reports', [
    ['Revenue Reports', 'revenue'],
    ['Collection Reports', 'collections'],
    ['Customer Reports', 'customers'],
    ['Route Performance', 'route-performance'],
    ['Fleet Reports', 'fleet']
  ]),
  menu(90, 'Notifications', 'ri-notification-3-line', '/notifications', [
    ['SMS Notifications', 'sms'],
    ['Email Notifications', 'email'],
    ['Payment Alerts', 'payment-alerts'],
    ['Collection Alerts', 'collection-alerts']
  ]),
  menu(100, 'Administration', 'ri-settings-3-line', '/administration', [
    ['Users', 'users'],
    ['Roles & Permissions', 'roles-permissions'],
    ['System Settings', 'system-settings'],
    ['Audit Logs', 'audit-logs']
  ])
];
