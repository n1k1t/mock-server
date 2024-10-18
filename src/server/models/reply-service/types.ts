export interface IBaseRouteResponse<T> {
  status: 'OK' | 'INTERNAL_ERROR' | 'VALIDATION_ERROR' | 'NOT_FOUND';
  data: T;
}
