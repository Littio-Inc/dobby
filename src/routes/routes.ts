export enum Route {
  LOGIN = '/login/index.html',
  DASHBOARD = '/index.html',
  MONETIZATION = '/monetization/index.html',
  BACK_OFFICE_MOVEMENTS = '/back-office-movements/index.html',
  USERS = '/admin/users/index.html',
}

export const goTo = (route: Route) => {
  window.location.href = route.toString();
};
