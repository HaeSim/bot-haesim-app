/**
 * 날짜 관련 유틸리티 함수 모음
 */

/**
 * 날짜를 YYYY-MM-DD 형식의 문자열로 변환합니다.
 * @param date 변환할 날짜
 * @returns 포맷팅된 날짜 문자열
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 날짜를 YYYY-MM-DD HH:MM:SS 형식의 문자열로 변환합니다.
 * @param date 변환할 날짜
 * @returns 포맷팅된 날짜와 시간 문자열
 */
export function formatDateTime(date: Date): string {
  const formattedDate = formatDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${formattedDate} ${hours}:${minutes}:${seconds}`;
}

/**
 * 현재 시간으로부터 지정된 일수만큼 이후의 날짜를 반환합니다.
 * @param days 추가할 일수
 * @returns 계산된 미래 날짜
 */
export function addDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * 두 날짜 사이의 일수 차이를 계산합니다.
 * @param start 시작 날짜
 * @param end 종료 날짜
 * @returns 두 날짜 사이의 일수
 */
export function daysBetween(start: Date, end: Date): number {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const diffTime = Math.abs(endTime - startTime);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
