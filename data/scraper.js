const axios = require('axios').default;
const fs = require('fs');
const {DateTime} = require("luxon");
const Bottleneck = require("bottleneck");

/*path='./corona_by_zip/zipcases_1007.json'
if (fs.existsSync(path)) {
  console.log(path);
}

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000
});
async function call_axios(my_url) {
  axios({
    method: 'get',
    url: my_url,
    responseType: 'json'
  })
    .then(function (response) {
      file_path = './corona_by_zip/'+my_url.substr(my_url.lastIndexOf('/') + 1)
      fs.writeFile(file_path, JSON.stringify(response.data), function (err) {
        console.log(err);
      });
    });
}
const throttled_data = limiter.wrap(call_axios);
async function get_results(){
  let url_list = [];
  for (let i = 1; i < 40; i++) {
    let dt = DateTime.fromISO("2020-12-30").minus({days: i * 7});
    if (dt.c.day < 10) {
      dt.c.day = '0' + dt.c.day
    }
    let path='./corona_by_zip/zipcases_'+ dt.c.month + dt.c.day + '.json'
    if (fs.existsSync(path)) {
      console.log(path  + 'EXISTS, youf ool!!!');
    } else {
      url_string = 'https://projects.oregonlive.com/coronavirus/data/zipcases_' + dt.c.month + dt.c.day + '.json'
      url_list.push(url_string)
    }

  }
  const allThePromises = url_list.map(the_url => {
    return throttled_data(the_url);
  })
  try{
    const results = await Promise.all(allThePromises);
    console.log(results);
  }
  catch(err){
    console.log(err, the_url);
  }
}
get_results()*/

/*
my_url = 'https://projects.oregonlive.com/coronavirus/data/zipcases_1112.json';
axios({
  method: 'get',
  url: my_url,
  responseType: 'json'
})
  .then(function (response) {
    file_path = './corona_by_zip/zipcases_1112.json'
    fs.writeFile(file_path, JSON.stringify(response.data), function (err) {
      console.log(err);
    });
  });
*/

my_url = 'https://projects.oregonlive.com/coronavirus/data/rona_zip2.json';
axios({
  method: 'get',
  url: my_url,
  responseType: 'json'
})
  .then(function (response) {
    file_path = './corona_by_zip/rona_zip2.json'
    fs.writeFile(file_path, JSON.stringify(response.data), function (err) {
      console.log(err);
    });
    console.log('wrote')
  });
