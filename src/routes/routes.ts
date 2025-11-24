export enum Route {
  LOGIN = '/login',
  DASHBOARD = '/',
  MONETIZATION = '/monetization',
  FINOPS = '/finops',
  CS = '/cs',
  ACCOUNTING = '/accounting',
  MARKETING = '/marketing',
  HR = '/hr',
  ADMIN = '/admin',
  USERS = '/admin/users',
}

export const goTo = (route: Route) => {
  window.location.href = route.toString();
};
