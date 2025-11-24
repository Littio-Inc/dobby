export enum Route {
  LOGIN = '/login/index.html',
  DASHBOARD = '/index.html',
  MONETIZATION = '/monetization/index.html',
  FINOPS = '/finops/index.html',
  CS = '/cs/index.html',
  ACCOUNTING = '/accounting/index.html',
  MARKETING = '/marketing/index.html',
  HR = '/hr/index.html',
  ADMIN = '/admin/index.html',
  USERS = '/admin/users/index.html',
}

export const goTo = (route: Route) => {
  window.location.href = route.toString();
};
