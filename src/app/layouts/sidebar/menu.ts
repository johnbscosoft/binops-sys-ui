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
  {
    id: 20,
    label: 'Customer Management',
    icon: 'ri-user-3-line',
    isCollapsed: true,
    subItems: [
      { id: 2001, label: 'Customers', link: '/customers/list', parentId: 20 },
      { id: 2002, label: 'Properties', link: '/customers/properties', parentId: 20 },
      // Not yet implemented:
      // { id: 2003, label: 'Customer Details', link: '/customers/details', parentId: 20 },
      { id: 2004, label: 'Customer Contracts', link: '/customers/contracts', parentId: 20 },
      // { id: 2005, label: 'Customer Locations', link: '/customers/locations', parentId: 20 },
      // { id: 2006, label: 'QR Codes', link: '/customers/qr-codes', parentId: 20 },
      {
        id: 2007,
        label: 'Reports',
        parentId: 20,
        isCollapsed: true,
        subItems: [
          { id: 200701, label: 'Customer Summary', link: '/customers/reports/summary', parentId: 2007 },
          { id: 200702, label: 'Customer Status', link: '/customers/reports/status', parentId: 2007 },
          { id: 200703, label: 'Property Occupancy', link: '/customers/reports/property-occupancy', parentId: 2007 },
          { id: 200704, label: 'Property Collection Register', link: '/customers/reports/property-collections', parentId: 2007 },
          { id: 200705, label: 'Customer Subscriptions', link: '/customers/reports/subscriptions', parentId: 2007 }
        ]
      }
    ]
  },
  menu(30, 'Subscriptions', 'ri-repeat-2-line', '/subscriptions', [
    // Not yet implemented:
    // ['Active Subscriptions', 'active'],
    // ['Expiring Subscriptions', 'expiring'],
    ['Subscription Plans', 'plans'],
    // ['Renewal History', 'renewal-history']
  ]),
  /* Modules below are hidden until their pages and routes are implemented.
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
  ]), */
  menu(100, 'Administration', 'ri-settings-3-line', '/administration', [
    ['Users', 'users'],
    // Not yet implemented:
    // ['Roles & Permissions', 'roles-permissions'],
    ['Company Settings', 'company-settings'],
    ['Client Categories', 'client-categories'],
    ['Authentication Settings', 'authentication-settings'],
    // ['System Settings', 'system-settings'],
    // ['Audit Logs', 'audit-logs']
  ])
];
