// coreui stuff
import React, { Component, lazy } from "react";
import {
  CBadge,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardFooter,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CCallout,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CWidgetDropdown,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import ChartLineSimple from "../charts/ChartLineSimple";
import ChartBarSimple from "../charts/ChartBarSimple";

// leaflet stuff
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// needed data
const zip_codes_layer = require("../../data/zip_code_boundaries.json");
const areas = require("../../data/areas.json");
const data = require("../../data/case_numbers.json");

// set the bounds for lat/lon
const bounds_lat_lon = [
  [45.2, -123.0],
  [45.6, -122.0],
];

// create bins for the choropleth
const bin_maker = function (num, bin_count = 5) {
  let bin_breaks = num / bin_count;
  let bins = [];
  for (let i = 0; i < bin_count + 1; i++) {
    bins.push(Math.ceil(i * bin_breaks));
  }
  return [bins, bin_breaks, num, bin_count];
};

class Dashboard extends Component {
  constructor() {
    super();
    this.state = {
      cases_week_one: null,
      cases_week_two: null,
      bins: null,
      bin_breaks: null,
      num: null,
      bin_count: null,
      selected_analysis: "Raw Population",
      choropleth_vals: [],
      case_numbers: {
        cases: [],
        last_week: [],
        population: [],
        area: [],
      },
      oregon: {
        cases: 0,
        last_week: 0,
        population: 0,
        area: 0,
      },
      filters: {
        number_of_weeks: 2,
        date: dates[0],
      },
      selected: {
        zip_code: 97202,
        cases: 0,
        population: 0,
        last_week: 0,
        week_two: 0,
        zip_data_week_one: 0,
        zip_data_week_two: 0,
        one_week_difference: 0,
        two_week_difference: 0,
      },
    };
    this.onEachZipCode = this.onEachZipCode.bind(this);
    this.calculateBiggestDifferences = this.calculateBiggestDifferences.bind(
      this
    );
    this.handleChange = this.handleChange.bind(this);
    this.handleNumberChange = this.handleNumberChange.bind(this);
    this.getColor = this.getColor.bind(this);
    this.style = this.style.bind(this);
  }

  componentDidMount() {
    // load data

    // get the default zip code data for the past two weeks
    let data_week_one = data.filter(
      (record) => String(record.date_key) === file_names[0]
    );
    let cases_week_one = data_week_one[0].cases;
    let data_week_two = data.filter(
      (record) => String(record.date_key) === file_names[1]
    );
    let cases_week_two = data_week_two[0].cases;

    /*
     * THIS SECTION:
     * 1. CALCULATES THE LARGEST DIFFERENCES
     * 2. DIVIDES BY 5
     * 3. CREATES BIN FOR THE CHOROPLETH MAP
     */
    let biggest_difference = this.calculateBiggestDifferences(
      cases_week_one,
      cases_week_two
    );
    let [bins, bin_breaks, num, bin_count] = bin_maker(biggest_difference);

    // get this week's oregon
    let oregon = {};
    oregon.cases = cases_week_one
      .map((zip_data) => zip_data.cases)
      .reduce((acc, cases) => cases + acc);
    oregon.last_week = cases_week_one
      .map((zip_data) => zip_data.last_week)
      .reduce((acc, last_week) => last_week + acc);
    oregon.population = zip_codes_layer.features
      .map((zip_data) => zip_data.properties.population)
      .reduce((acc, pop) => pop + acc);
    oregon.area = areas
      .map((zip_area) => zip_area.area)
      .reduce((acc, area) => area + acc);

    let case_numbers = {};
    case_numbers.cases = cases_week_one
      .map((zip_data) => zip_data.cases)
      .sort((a, b) => a - b);
    case_numbers.last_week = cases_week_one
      .map((zip_data) => zip_data.last_week)
      .sort((a, b) => a - b);
    case_numbers.population = cases_week_one
      .map((zip_data) => zip_data.population)
      .sort((a, b) => a - b);
    case_numbers.area = cases_week_one
      .map((zip_data) => zip_data.area)
      .sort((a, b) => a - b);
    console.log(case_numbers.cases.indexOf(593), "case_rank");

    /*
     * BUILD UP this.state.selected with init_selections = this.state.selected = {...}
     */
    let init_selections = {};
    init_selections.zip_code = "97202";
    init_selections.population = 42822;

    // filters down the the zip code we want and selects the key/value pair set
    init_selections.zip_data_week_one = cases_week_one.filter(
      (record) => String(record.zip) === init_selections.zip_code
    );
    init_selections.zip_data_week_two = cases_week_two.filter(
      (record) => String(record.zip) === init_selections.zip_code
    );

    // get the three values of current cases, last week's cases and cases two weeks ago
    if (init_selections.zip_data_week_one.length > 0) {
      init_selections.cases = init_selections.zip_data_week_one[0].cases;
      init_selections.week_one = init_selections.zip_data_week_one[0].last_week;
      init_selections.week_two = init_selections.zip_data_week_two[0].last_week;
    }

    // get the differences of each one of these
    init_selections.one_week_difference =
      init_selections.cases - init_selections.week_one;
    init_selections.two_week_difference =
      init_selections.cases - init_selections.week_two;

    // now normalize that by poulation
    init_selections.normalized_one_week_difference =
      init_selections.one_week_difference / init_selections.population;
    init_selections.normalized_two_week_difference =
      init_selections.two_week_difference / init_selections.population;

    // set the state
    this.setState(
      {
        selected: init_selections,
        bins,
        bin_breaks,
        num,
        bin_count,
        cases_week_one,
        cases_week_two,
        oregon,
        case_numbers,
      },
      () => {
        /*console.log(this.state, 'dealersOverallTotal1');*/
      }
    );
  }

  // gets the biggest differences in the last two weeks
  calculateBiggestDifferences = (begin_week, end_week) => {
    let case_counts = begin_week;

    let differences = [];
    for (const w1 in begin_week) {
      const zip_check = begin_week[w1].zip;
      let results = end_week.filter(function (entry) {
        return entry.zip === zip_check;
      });

      // get the difference between the two weeks cases
      const diff_check = begin_week[w1].cases - results[0].last_week;
      differences.push(diff_check);

      let vals = this.state.choropleth_vals;
      vals.push({
        zip: begin_week[w1].zip,
        diff: diff_check,
      });
      this.setState({ choropleth_vals: vals }, () => {
        // console.log(this.state, 'dealersOverallTotal1');
      });
    }
    return Math.max(...differences);
  };

  // this loads in the popups and calculates data for each zip code based on the geojson file
  onEachZipCode = (feature, layer) => {
    let selected_state = this.state.selected;
    layer.on({
      click: (e) => {
        selected_state.zip_code = e.sourceTarget.feature.properties.GEOID10;
        selected_state.population =
          e.sourceTarget.feature.properties.population;
        selected_state.zip_data_week_one = this.state.cases_week_one.filter(
          (record) => String(record.zip) === selected_state.zip_code
        );
        selected_state.zip_data_week_two = this.state.cases_week_two.filter(
          (record) => String(record.zip) === selected_state.zip_code
        );

        if (selected_state.zip_data_week_one.length > 0) {
          selected_state.cases = selected_state.zip_data_week_one[0].cases;
          selected_state.week_one =
            selected_state.zip_data_week_one[0].last_week;
          selected_state.week_two =
            selected_state.zip_data_week_two[0].last_week;
        }
        selected_state.one_week_difference =
          selected_state.cases - selected_state.week_one;
        selected_state.two_week_difference =
          selected_state.cases - selected_state.week_two;
        selected_state.normalized_one_week_difference =
          selected_state.one_week_difference / selected_state.population;
        selected_state.normalized_two_week_difference =
          selected_state.two_week_difference / selected_state.population;
        this.setState({ selected_state }, () => {
          /*console.log(this.state.selected, 'dealersOverallTotal1');*/
        });

        return layer
          .bindPopup(
            `
  <b>Zip Code:</b> ${selected_state.zip_code}<br/> 
  <b>Population:</b> ${selected_state.population}<br/>
  <b>Total Cases:</b> ${selected_state.cases}<br/>
  <b>Total Cases Last Week:</b> ${selected_state.week_one}<br/>
  <b>Total Cases Last Two Weeks:</b> ${selected_state.week_two}<br/>
  <b>New Cases Past One Week:</b> ${selected_state.one_week_difference}<br/>
  <b>New Cases Past Two Weeks:</b> ${selected_state.two_week_difference}<br/>
  <b>Normalized by Pop New Cases This Week:</b> ${selected_state.normalized_two_week_difference.toFixed(
    6
  )}<br/>
  <b>Normalized by Pop New Cases Last Two Weeks:</b> ${selected_state.normalized_two_week_difference.toFixed(
    6
  )}<br/>
  `
            // add if you want autoPan turned off
            // , {autoPan:false}
          )
          .openPopup();
      },
    });
  };

  // does not modify state
  style(feature) {
    const ZIP_CODE = feature.properties.GEOID10;
    const ZIP_DATA_WEEK_ONE = this.state.cases_week_one.filter(
      (record) => String(record.zip) === ZIP_CODE
    );
    const ZIP_DATA_WEEK_TWO = this.state.cases_week_two.filter(
      (record) => String(record.zip) === ZIP_CODE
    );

    let cases = 0;
    let lastWeek = 0;
    let twoWeeks = 0;
    if (ZIP_DATA_WEEK_ONE.length > 0) {
      cases = ZIP_DATA_WEEK_ONE[0].cases;
      twoWeeks = ZIP_DATA_WEEK_TWO[0].last_week;
    }
    const TWO_WEEK_DIFFERENCE = cases - twoWeeks;
    const TWO_WEEK_DIFFERENCE_BY_POP =
      TWO_WEEK_DIFFERENCE / feature.properties.population;

    return {
      fillColor: this.getColor(TWO_WEEK_DIFFERENCE),
      weight: 2,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
    };
  }

  // set choropleth?
  getColor = (d) => {
    return d > this.state.bins[4]
      ? "#2c7fb8"
      : d > this.state.bins[3]
      ? "#2c7fb8"
      : d > this.state.bins[2]
      ? "#4ab6c4"
      : d > this.state.bins[1]
      ? "#7fcdbb"
      : "#c7e9b4";
  };

  handleChange = (e) => {
    console.log(e);
    //this.setState({filters.date: e});
  };

  handleNumberChange = (e) => {
    let selects = this.state.selected;
    selects.number_of_weeks = e;
    console.log(e);
    this.setState({ selected: selects });
  };

  render() {
    /*console.log(this.state.oregon.population)*/
    return (
      <>
        <CCard>
          <CCard>
            <CCardBody>
              <CCardHeader>
                <CRow className="text-center">
                  <CCol md sm="12" className="mb-sm-2 mb-0">
                    <h5 className="text-muted">Data From</h5>
                    <h2>{this.state.filters.date}</h2>
                  </CCol>
                  <CCol md sm="12" className="mb-sm-2 mb-0">
                    <h5 className="text-muted">Zip Code</h5>
                    <h2>{this.state.selected.zip_code}</h2>
                  </CCol>
                  <CCol md sm="12" className="mb-sm-2 mb-0 d-md-down-none">
                    <div className="text-muted">Total Cases in Zip to Date</div>
                    <strong>
                      {this.state.selected.cases}                       (
                      {(
                        this.state.selected.cases / this.state.oregon.cases
                      ).toFixed(2)}
                      )%
                    </strong>
                    <br/>
                    <strong>Rank: {this.state.case_numbers.cases.indexOf(this.state.selected.cases)+1} of {this.state.case_numbers.cases.length} counties</strong>
                    <CProgress
                      className="progress-xs mt-2"
                      precision={1}
                      color="info"
                      value={(this.state.case_numbers.cases.indexOf(this.state.selected.cases)+1)/this.state.case_numbers.cases.length.toFixed(2)*100}
                    />
                  </CCol>

                  <CCol md sm="12" className="mb-sm-2 mb-0">
                    <div className="text-muted">Cases in Zip Last Two Weeks</div>
                    <strong>{this.state.selected.cases}                       (
                      {(
                        this.state.selected.cases / this.state.oregon.cases
                      ).toFixed(2)}
                      )%</strong>
                    <CProgress
                      className="progress-xs mt-2"
                      precision={1}
                      color="danger"
                      value={40}
                    />
                  </CCol>
                  <CCol md sm="12" className="mb-sm-2 mb-0 d-md-down-none">
                    <div className="text-muted">Bounce Rate</div>
                    <strong>Average Rate (40.15%)</strong>
                    <CProgress
                      className="progress-xs mt-2"
                      precision={1}
                      value={40}
                    />
                  </CCol>
                </CRow>
              </CCardHeader>
              {/*<CRow>
                <CCol sm="5">
                  <h4 id="traffic" className="card-title mb-0">
                    Oregon Totals
                  </h4>
                  <div className="small text-muted">November 2017</div>
                </CCol>
                <CCol sm="7" className="d-none d-md-block">
                  <CButton color="primary" className="float-right">
                    <CIcon name="cil-cloud-download" />
                  </CButton>
                  <CButtonGroup className="float-right mr-3">
                    {["Day", "Month", "Year"].map((value) => (
                      <CButton
                        color="outline-secondary"
                        key={value}
                        className="mx-0"
                        active={value === "Month"}
                      >
                        {value}
                      </CButton>
                    ))}
                  </CButtonGroup>
                </CCol>
              </CRow>*/}
              <CRow>
                <CCol sm="3">
                  <h1>Oregon Totals</h1>
                </CCol>
                <CCol sm="9">
                  <MapContainer
                    style={{ height: "500px" }}
                    bounds={bounds_lat_lon}
                    zoomControl={true}
                    doubleClickZoom={true}
                    scrollWheelZoom={true}
                    dragging={true}
                    onclick={this.handleClick}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, basemap tiles &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png"
                    />

                    <GeoJSON
                      data={zip_codes_layer}
                      onEachFeature={this.onEachZipCode}
                      style={this.style}
                    />
                  </MapContainer>
                </CCol>
              </CRow>
            </CCardBody>
            <CCardFooter>
              <CRow className="text-center">
                <CCol md sm="12" className="mb-sm-2 mb-0">
                  <div className="text-muted">Visits</div>
                  <strong>29.703 Users (40%)</strong>
                  <CProgress
                    className="progress-xs mt-2"
                    precision={1}
                    color="success"
                    value={40}
                  />
                </CCol>
                <CCol md sm="12" className="mb-sm-2 mb-0 d-md-down-none">
                  <div className="text-muted">Unique</div>
                  <strong>24.093 Users (20%)</strong>
                  <CProgress
                    className="progress-xs mt-2"
                    precision={1}
                    color="info"
                    value={40}
                  />
                </CCol>
                <CCol md sm="12" className="mb-sm-2 mb-0">
                  <div className="text-muted">Pageviews</div>
                  <strong>78.706 Views (60%)</strong>
                  <CProgress
                    className="progress-xs mt-2"
                    precision={1}
                    color="warning"
                    value={40}
                  />
                </CCol>
                <CCol md sm="12" className="mb-sm-2 mb-0">
                  <div className="text-muted">New Users</div>
                  <strong>22.123 Users (80%)</strong>
                  <CProgress
                    className="progress-xs mt-2"
                    precision={1}
                    color="danger"
                    value={40}
                  />
                </CCol>
                <CCol md sm="12" className="mb-sm-2 mb-0 d-md-down-none">
                  <div className="text-muted">Bounce Rate</div>
                  <strong>Average Rate (40.15%)</strong>
                  <CProgress
                    className="progress-xs mt-2"
                    precision={1}
                    value={40}
                  />
                </CCol>
              </CRow>
            </CCardFooter>
          </CCard>
          <CCardHeader className="text-center text-value-lg">
            Oregon Cases
          </CCardHeader>
          <CCardBody>
            <CRow>
              <CCol sm={3}>
                <CDropdown className="m-1">
                  <CDropdownToggle>
                    <h1>
                      <u>Dates</u>
                    </h1>
                    {this.state.filters.date}
                  </CDropdownToggle>
                  <CDropdownMenu
                    value={this.state.filters.date}
                    onChange={this.handleChange}
                  >
                    {dates.map((date) => (
                      <CDropdownItem>{date}</CDropdownItem>
                    ))}
                  </CDropdownMenu>
                </CDropdown>
              </CCol>
              <CCol sm={3}>
                <CDropdown className="m-1">
                  <CDropdownToggle>
                    <h1>
                      <u>Number of Weeks Difference</u>
                    </h1>
                    {this.state.selected.number_of_weeks}
                  </CDropdownToggle>
                  <CDropdownMenu
                    value={this.state.selected.number_of_weeks}
                    onChange={this.handleNumberChange}
                  >
                    {[...Array(dates.length).keys()].map((week_distance) => (
                      <CDropdownItem>{week_distance}</CDropdownItem>
                    ))}
                  </CDropdownMenu>
                </CDropdown>
              </CCol>
              <CCol sm={3}>
                <h1>{this.state.filters.date}</h1>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
        <CRow>
          <CCol sm="6" lg="3">
            <CWidgetDropdown
              color="gradient-info"
              header={this.state.selected.zip_code}
              text="Zip Code"
              footerSlot={
                <ChartLineSimple
                  pointed
                  className="mt-3 mx-3"
                  style={{ height: "70px" }}
                  dataPoints={[1, 18, 9, 17, 34, 22, 11]}
                  pointHoverBackgroundColor="info"
                  options={{ elements: { line: { tension: 0.00001 } } }}
                  label="Members"
                  labels="months"
                />
              }
            >
              <CDropdown>
                <CDropdownToggle caret={false} color="transparent">
                  <CIcon name="cil-location-pin" />
                </CDropdownToggle>
                <CDropdownMenu className="pt-0" placement="bottom-end">
                  <CDropdownItem>Action</CDropdownItem>
                  <CDropdownItem>Another action</CDropdownItem>
                  <CDropdownItem>Something else here...</CDropdownItem>
                  <CDropdownItem disabled>Disabled action</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </CWidgetDropdown>
          </CCol>
          <CCol sm="6" lg="3">
            <CWidgetDropdown
              color="gradient-primary"
              header={this.state.selected.cases}
              text="Total Cases"
              footerSlot={
                <ChartLineSimple
                  pointed
                  className="c-chart-wrapper mt-3 mx-3"
                  style={{ height: "70px" }}
                  dataPoints={[65, 59, 84, 84, 51, 55, 40]}
                  pointHoverBackgroundColor="primary"
                  label="Cases"
                  labels="Weeks"
                />
              }
            >
              <CDropdown className="m-1">
                <CDropdownToggle style={{ color: "#ffffff" }}>
                  <CIcon name="cil-settings" />
                </CDropdownToggle>
                <CDropdownMenu
                  value={this.state.selected_analysis}
                  onChange={this.handleChangeAnalysis}
                >
                  <CDropdownItem>Raw Population</CDropdownItem>
                  <CDropdownItem>Normalized by Population</CDropdownItem>
                  <CDropdownItem>Normalized by Area</CDropdownItem>
                  <CDropdownItem>Raw Total Cases</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </CWidgetDropdown>
          </CCol>

          <CCol sm="6" lg="3">
            <CWidgetDropdown
              color="gradient-warning"
              header={this.state.selected.two_week_difference}
              text="New Cases Past Two Weeks"
              footerSlot={
                <ChartLineSimple
                  className="mt-3"
                  style={{ height: "70px" }}
                  backgroundColor="rgba(255,255,255,.2)"
                  dataPoints={[78, 81, 80, 45, 34, 12, 40]}
                  options={{ elements: { line: { borderWidth: 2.5 } } }}
                  pointHoverBackgroundColor="warning"
                  label="Members"
                  labels="months"
                />
              }
            >
              <CDropdown>
                <CDropdownToggle color="transparent">
                  <CIcon name="cil-settings" />
                </CDropdownToggle>
                <CDropdownMenu className="pt-0" placement="bottom-end">
                  <CDropdownItem>Action</CDropdownItem>
                  <CDropdownItem>Another action</CDropdownItem>
                  <CDropdownItem>Something else here...</CDropdownItem>
                  <CDropdownItem disabled>Disabled action</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </CWidgetDropdown>
          </CCol>

          <CCol sm="6" lg="3">
            <CWidgetDropdown
              color="gradient-danger"
              header="9.823"
              text="Members online"
              footerSlot={
                <ChartBarSimple
                  className="mt-3 mx-3"
                  style={{ height: "70px" }}
                  backgroundColor="rgb(250, 152, 152)"
                  label="Members"
                  labels="months"
                />
              }
            >
              <CDropdown>
                <CDropdownToggle
                  caret
                  className="text-white"
                  color="transparent"
                >
                  <CIcon name="cil-settings" />
                </CDropdownToggle>
                <CDropdownMenu className="pt-0" placement="bottom-end">
                  <CDropdownItem>Action</CDropdownItem>
                  <CDropdownItem>Another action</CDropdownItem>
                  <CDropdownItem>Something else here...</CDropdownItem>
                  <CDropdownItem disabled>Disabled action</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </CWidgetDropdown>
          </CCol>
        </CRow>

        <CCard></CCard>
      </>
    );
  }
}
let file_names = [
  "200527",
  "200603",
  "200610",
  "200617",
  "200624",
  "200701",
  "200708",
  "200715",
  "200722",
  "200729",
  "200805",
  "200812",
  "200819",
  "200826",
  "200902",
  "200910",
  "200916",
  "200923",
  "200930",
  "201007",
  "201014",
  "201021",
  "201028",
  "201104",
  "201112",
  "201118",
  "201125",
  "201202",
  "201209",
  "201216",
  "201223",
  "201230",
  "210106",
].reverse();

let dates = [
  "2021-01-06",
  "2020-12-30",
  "2020-12-23",
  "2020-12-16",
  "2020-12-09",
  "2020-12-02",
  "2020-11-25",
  "2020-11-18",
  "2020-11-11",
  "2020-11-04",
  "2020-10-28",
  "2020-10-21",
  "2020-10-14",
  "2020-10-07",
  "2020-09-30",
  "2020-09-23",
  "2020-09-16",
  "2020-09-09",
  "2020-09-02",
  "2020-08-26",
  "2020-08-19",
  "2020-08-12",
  "2020-08-05",
  "2020-07-29",
  "2020-07-22",
  "2020-07-15",
  "2020-07-08",
  "2020-07-01",
  "2020-06-24",
  "2020-06-17",
  "2020-06-10",
  "2020-06-03",
  "2020-05-27",
];

export default Dashboard;
