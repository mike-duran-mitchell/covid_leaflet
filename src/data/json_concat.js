const fs = require('fs');
const path = require('path');
const jsonConcat = require('json-concat')

const dir = '/corona_by_zip/';
let marray = [];
/*const theDirectory = './corona_by_zip'; // or whatever directory you want to read
fs.readdirSync(theDirectory).forEach((file) => {

  let fname = './corona_by_zip/'+file
  fs.readFileSync(fname, (err, data) => {
    if (err) throw err;
    let zip_code_data = JSON.parse(data);
    let json_name = file.replace('zipcases_','');
    let obj = {}
    obj[json_name] = zip_code_data
    marray.push(obj);
  })

})*/
let files = fs.readdirSync('../'+ dir);
console.log(__dirname);
files.forEach(function(file) {

  if(file.includes('zipcases_')){
    var data = fs.readFileSync('..'+ dir+ file,);
    let zip_code_data = JSON.parse(data);
    let json_name = file.replace('zipcases_','').replace('.json','');
    for (const property in zip_code_data) {
      zip_code_data[property].diff = zip_code_data[property].cases-zip_code_data[property].last_week
    }
    let obj = {date_key: `${json_name}`, cases: zip_code_data}
    /*
    console.log(zip_code_data)*/
    marray.push(obj);
  }


})

fs.writeFile('case_numbers.json', JSON.stringify(marray), (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});
/*cons

console.log(files)

// pass the "files" to json concat
jsonConcat({
  src: files,
  dest: "./result.json"
}, function (json) {
  console.log(json);
});*/
