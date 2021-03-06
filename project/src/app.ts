// 라이브러리 로딩
// import 이름 from '라이브러리 이름'
import axios, { AxiosResponse } from 'axios';
import Chart from 'chart.js/auto';

// 타입 모듈
// import {타입 이름} from '모듈 이름'
import { CoivdSummaryResponse, Country } from './covid/index';
import { CountrySummaryResponse, CountryInfo } from './deaths/index';

// utils DOM 접근 함수
function $<T extends HTMLElement = HTMLDivElement>(selector: string) {
  // HTMLElement에 호환되는 것들만 사용 가능할 수 있도록 제한
  // default 값은 HTMLDivElement
  const element = document.querySelector(selector);
  return element as T;
  // null 처리를 따로 안할 수 있도록 타입 단언
}

function getUnixTimestamp(date: string | number | Date) {
  return new Date(date).getTime();
}

// DOM Element 타입을 반환하기 때문에 타입 단언이 없다고 판단하기 때문에 as를 사용해서 호환할 수 있는 타입 단언을 정의해야 한다.
//const temp = $<HTMLDivElement>('.acb');
const confirmedTotal = <HTMLSpanElement>$('.confirmed-total'); //$ == document.querySeletor
const deathsTotal = <HTMLParagraphElement>$('.deaths');
const recoveredTotal = <HTMLParagraphElement>$('.recovered');
const lastUpdatedTime = <HTMLParagraphElement>$('.last-updated-time');
const rankList = <HTMLOListElement>$('.rank-list');
const deathsList = <HTMLOListElement>$('.deaths-list');
const recoveredList = <HTMLOListElement>$('.recovered-list');
const deathSpinner = createSpinnerElement('deaths-spinner');
const recoveredSpinner = createSpinnerElement(
  'recovered-spinner'
) as HTMLDivElement;

function createSpinnerElement(id: string) {
  const wrapperDiv = document.createElement('div');
  wrapperDiv.setAttribute('id', id);
  wrapperDiv.setAttribute(
    'class',
    'spinner-wrapper flex justify-center align-center'
  );
  const spinnerDiv = document.createElement('div');
  spinnerDiv.setAttribute('class', 'ripple-spinner');
  spinnerDiv.appendChild(document.createElement('div'));
  spinnerDiv.appendChild(document.createElement('div'));
  wrapperDiv.appendChild(spinnerDiv);
  return wrapperDiv;
}

// state
let isDeathLoading = false;
const isRecoveredLoading = false;

// api
// /**
//  *
//  * @typedef {object} CovieSummary
//  * @property {Array<object>} Country
//  */

// /**
//  *
//  * @returns {Promise<CovieSummary>}
//  */

function fetchCovidSummary(): Promise<AxiosResponse<CoivdSummaryResponse>> {
  const url = 'https://api.covid19api.com/summary';
  return axios.get(url);
}

// fetchCovidSummary().then(res =>{ //JSdoc 타입 정의
//   console.log(res.data.Countries)
// })
enum CovidStatus {
  Confirmed = 'confirmed',
  Recovered = 'recorverd',
  Deaths = 'deaths',
}

function fetchCountryInfo(
  countryName: string | undefined,
  status: CovidStatus
): Promise<AxiosResponse<CountrySummaryResponse>> {
  // params: confirmed, recovered, deaths``
  const url = `https://api.covid19api.com/country/${countryName}/status/${status}`;
  return axios.get(url);
}

// methods
function startApp(): void {
  setupData();
  initEvents();
}

// events
function initEvents() {
  if (!rankList) {
    return;
  }
  rankList.addEventListener('click', handleListClick);
}

async function handleListClick(event: Event) {
  let selectedId;
  if (
    event.target instanceof HTMLParagraphElement ||
    event.target instanceof HTMLSpanElement
  ) {
    selectedId = event.target.parentElement
      ? event.target.parentElement.id
      : undefined;
  }
  if (event.target instanceof HTMLLIElement) {
    selectedId = event.target.id;
  }
  if (isDeathLoading) {
    return;
  }
  clearDeathList();
  clearRecoveredList();
  startLoadingAnimation();
  isDeathLoading = true;
  const { data: deathResponse } = await fetchCountryInfo(
    selectedId,
    CovidStatus.Deaths
  );
  const { data: recoveredResponse } = await fetchCountryInfo(
    selectedId,
    CovidStatus.Recovered
  );
  const { data: confirmedResponse } = await fetchCountryInfo(
    selectedId,
    CovidStatus.Confirmed
  );
  endLoadingAnimation();
  setDeathsList(deathResponse);
  setTotalDeathsByCountry(deathResponse);
  setRecoveredList(recoveredResponse);
  setTotalRecoveredByCountry(recoveredResponse);
  setChartData(confirmedResponse);
  isDeathLoading = false;
}

function setDeathsList(data: CountrySummaryResponse) {
  const sorted = data.sort(
    (a: CountryInfo, b: CountryInfo) =>
      getUnixTimestamp(b.Date) - getUnixTimestamp(a.Date)
  );
  sorted.forEach((value: CountryInfo) => {
    const li = document.createElement('li');
    li.setAttribute('class', 'list-item-b flex align-center');
    const span = document.createElement('span');
    span.textContent = value.Cases.toString();
    span.setAttribute('class', 'deaths');
    const p = document.createElement('p');
    p.textContent = new Date(value.Date).toLocaleDateString().slice(0, -1);
    li.appendChild(span);
    li.appendChild(p);
    deathsList!.appendChild(li); // type assertion
  });
}

function clearDeathList() {
  deathsList.innerHTML = '';
}
// var a: Element | HTMLElement | HTMLParagraphElement -> 상위에서 하위로 ,타입구조체의 위계
function setTotalDeathsByCountry(data: CountrySummaryResponse) {
  //p태그 안에 있음
  deathsTotal.innerText = data[0].Cases.toString();
}

function setRecoveredList(data: CountrySummaryResponse) {
  const sorted = data.sort(
    (a: CountryInfo, b: CountryInfo) =>
      getUnixTimestamp(b.Date) - getUnixTimestamp(a.Date)
  );
  sorted.forEach((value: CountryInfo) => {
    const li = document.createElement('li');
    li.setAttribute('class', 'list-item-b flex align-center');
    const span = document.createElement('span');
    span.textContent = value.Cases.toString();
    span.setAttribute('class', 'recovered');
    const p = document.createElement('p');
    p.textContent = new Date(value.Date).toLocaleDateString().slice(0, -1);
    li.appendChild(span);
    li.appendChild(p);
    recoveredList?.appendChild(li);
    // ? 의 의미 삼항연산자와는 다름
    // if (recoveredList === null || recoveredList === undefined) {
    //   return;
    // } else {
    //   recoveredList.appendChild(li);
    // }
  });
}

function clearRecoveredList() {
  recoveredList.innerHTML = '';
}

function setTotalRecoveredByCountry(data: CountrySummaryResponse) {
  recoveredTotal.innerText = data[0].Cases.toString();
}

function startLoadingAnimation() {
  deathsList.appendChild(deathSpinner);
  recoveredList.appendChild(recoveredSpinner);
}

function endLoadingAnimation() {
  deathsList.removeChild(deathSpinner);
  recoveredList.removeChild(recoveredSpinner);
}

async function setupData() {
  const { data } = await fetchCovidSummary();
  setTotalConfirmedNumber(data);
  setTotalDeathsByWorld(data);
  setTotalRecoveredByWorld(data);
  setCountryRanksByConfirmedCases(data);
  setLastUpdatedTimestamp(data);
}

function renderChart(data: number[], labels: string[]) {
  const lineChart = $('#lineChart') as HTMLCanvasElement;
  const ctx = lineChart.getContext('2d');
  Chart.defaults.global.defaultFontColor = '#f5eaea';
  Chart.defaults.global.defaultFontFamily = 'Exo 2';
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Confirmed for the last two weeks',
          backgroundColor: '#feb72b',
          borderColor: '#feb72b',
          data,
        },
      ],
    },
    options: {},
  });
}

function setChartData(data: CountrySummaryResponse) {
  const chartData = data.slice(-14).map((value: CountryInfo) => value.Cases);
  const chartLabel = data
    .slice(-14)
    .map((value: CountryInfo) =>
      new Date(value.Date).toLocaleDateString().slice(5, -1)
    );
  renderChart(chartData, chartLabel);
}

function setTotalConfirmedNumber(data: CoivdSummaryResponse) {
  confirmedTotal.innerText = data.Countries.reduce(
    (total: number, current: Country) => (total += current.TotalConfirmed),
    0
  ).toString();
}

function setTotalDeathsByWorld(data: CoivdSummaryResponse) {
  deathsTotal.innerText = data.Countries.reduce(
    (total: number, current: Country) => (total += current.TotalDeaths),
    0
  ).toString();
}

function setTotalRecoveredByWorld(data: CoivdSummaryResponse) {
  recoveredTotal.innerText = data.Countries.reduce(
    (total: number, current: Country) => (total += current.TotalRecovered),
    0
  ).toString();
}

function setCountryRanksByConfirmedCases(data: CoivdSummaryResponse) {
  const sorted = data.Countries.sort(
    (a: Country, b: Country) => b.TotalConfirmed - a.TotalConfirmed
  );
  sorted.forEach((value: Country) => {
    const li = document.createElement('li');
    li.setAttribute('class', 'list-item flex align-center');
    li.setAttribute('id', value.Slug);
    const span = document.createElement('span');
    span.textContent = value.TotalConfirmed.toString();
    span.setAttribute('class', 'cases');
    const p = document.createElement('p');
    p.setAttribute('class', 'country');
    p.textContent = value.Country;
    li.appendChild(span);
    li.appendChild(p);
    rankList.appendChild(li);
  });
}

function setLastUpdatedTimestamp(data: CoivdSummaryResponse): void {
  lastUpdatedTime.innerText = new Date(data.Date).toLocaleString();
}

startApp();
