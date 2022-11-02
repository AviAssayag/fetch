// SCROLL TO THE BOTTOM!!!
'use strict';
var request = require('request');
const express = require('express');
const app = express();
const port = process.env.PORT || 80;
const router = express.Router();
const puppeteer = require('puppeteer');
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default; 
const cloudinary = require('cloudinary');

app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:8000', 'https://restful-food-app.herokuapp.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
       res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.header('Access-Control-Allow-Credentials', true);
  return next();
});

(async () => {
  try {    

    const tenbis = {      
      get_restaurants_by_location:function (address){
        var geocoder = require('node-geocoder')('google', 'http');
        var Promise = require('promise');
        var baseUrl = 'https://www.10bis.co.il/Restaurants/';
        function apiRequest(url){
          return new Promise(function (resolve, reject) {
            request.get(baseUrl + url, function (err, res) {
              if (err){
                reject(err);
              } else {
                resolve(JSON.parse(res.body)); 
              }
            });
          });
        }

        var TenBis = function () {};

        TenBis.prototype.getRestaurantsByCoordinates = function (lat, lon, maxDistance) {
          var url = 'SearchRestaurantsListByMapBoundaries?destinationLng=' + lon + '&destinationLat=' + lat + '&notrhBoundary=333.09966358838387&southBoundary=32.09330130083669&westBoundary=34.769518607379155&eastBoundary=34.777028792620854&isKosher=false&cuisineType=&FilterByCoupon=false&mapBoundsExtension=0.009';
          return apiRequest(url).then(function (res){
            return res.map(function (restaurant) { 
              return restaurant.RestaurantName;
            });
          }, function (err) {
            console.log('err', err);
          });
        };

        TenBis.prototype.getRestaurantsByAddress = function (address) {
          var getRestaurants = function (results) {
            var result = results[0] || results;
            if (result) {
              return this.getRestaurantsByCoordinates(result.latitude, result.longitude);
            }
          }.bind(this);
          return geocoder.geocode(address).then(getRestaurants);
        };
        console.log(TenBis.prototype.getRestaurantsByAddress(address));
        // return TenBis.prototype.getRestaurantsByAddress(address);
      }
    }

    const imgs = {
      _cloudinary : {
        config: function () {
          cloudinary.v2.config({ 
            cloud_name: 'food-menu', 
            api_key: '117184552289661', 
            api_secret: 'oxU7Wft-3j6tOmNxnwCvlGMm9yU' 
          });
        },

        upload: function (img_url, public_url) {
          imgs._cloudinary.config();
          cloudinary.v2.uploader.upload(img_url,{             
            public_id: public_url, /*folder name and file name in cloudinary like "home/raisa/test"*/
            use_filename: true, 
            unique_filename: false
          },
          function(error, result) {
            console.log(result, error); 
          });
        }
      }
    } 

    const wolt = {
      fetch : async function(imgs) {          
        let places = ['https://wolt.com/he/isr/tel-aviv/restaurant/alibi'];
        for (var i = places.length - 1; i >= 0; i--) {          
          let place = places[i];      
          const __itemContainer = '1T8k';
          const browser = await puppeteer.launch();
          const page = await browser.newPage();          
          await page.goto(place); 
          await page.waitForSelector('.MenuItem-module__itemContainer____'+__itemContainer, { timeout: 20000 });
          const products = await page.evaluate(() => {                        
            const module__name = 'iqvnU';
            const module__description = 'uzvuX';
            const module__price = 'xYhkl';
            let items = [];
            let times_to_loop = document.querySelectorAll('.MenuItem-module__name___'+module__name).length;
            for (var f = times_to_loop -1; f >= 0; f--) {              
              let item_price_great_than_zero = document.querySelectorAll('.MenuItem-module__price___'+module__price)[f].innerText.replace(/[^\d.-]/g, '') > 0;
              let remove_by_description_length = document.querySelectorAll('.MenuItem-module__description___'+module__description)[f].innerText.length > 15;
              if(item_price_great_than_zero && remove_by_description_length){
                // let img_src = document.querySelector(".ImageWithTransition-module__image___2Tqzh").style.backgroundImage.replace('url("', '').replace('")','');
                // let public_url = "/מסעדה/" + document.querySelector('h1').innerText + "/מנה/" + document.querySelectorAll('.MenuItem-module__name___2bWFm')[f].innerText;
                // let cloudinary_res = imgs._cloudinary.upload(img_src,public_url);
                // console.log(cloudinary_res);                
                let item = {
                  name: document.querySelectorAll('.MenuItem-module__name___'+module__name)[f].innerText.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '') + " | " + document.querySelector('h1').innerText,
                  short_description:document.querySelectorAll('.MenuItem-module__description___'+module__description)[f].innerText,
                  images:[{                    
                    // src: 'https://naturally.co.il/wp-content/uploads/2021/08/logo_black.png',
                    // src: imgs[f].style.backgroundImage.replace('url("', '').replace('")','')
                  }],
                  type: "simple",
                  status:'publish',
                  reviews_allowed: true,
                  permalink: 'https://foodmenu.co.il/מסעדה/' + document.querySelector('h1').innerText + '/מנה/' + document.querySelectorAll('.MenuItem-module__name___'+module__name)[f].innerText,
                  regular_price: document.querySelectorAll('.MenuItem-module__price___'+module__price)[f].innerText.replace(/[^\d.-]/g, ''),                
                  // "תמונה":document.querySelector(".ImageWithTransition-module__image___2Tqzh").style.backgroundImage.replace('url("', '').replace('")',''),
                  // "מסעדה":document.querySelector('h1').innerText
                }
                items.push(item);
              }
            }
            return items;
          });

          if(products.length){
            for (var i = products.length -1; i >= 0; i--) {
              api._products.add(products[i]);
            }
          }         
          await browser.close();      
        }  
      } 
    };

    const api = new WooCommerceRestApi({
      url: "https://foodmenu.co.il",
      consumerKey: 'ck_4ccb70fa08146a01067376bb6e5ecaadc428138d',
      consumerSecret: 'cs_9f9fa79ac2d46cd96377f6604f9bfef79b9d7e11',
      version: "wc/v3"
    }); 

    api._stores = {

      get_all_stores: async function () {
        let url = 'https://foodmenu.co.il/wp-json/wcfmmp/v1/store-vendors'; // all
        request.get({
          url: url,
          json: true,
          headers: {'User-Agent': 'request'}
        },(err, res, data) => {
          if (err) {
            console.log('יש לך ארור יחנטריש:', err);
          } else if (res.statusCode !== 200) {
            console.log('Status:', res.statusCode);
          } else {
            console.log(data);
            return data;
          }
        })
      },

      get_products: async function (store_id) {
        let url = 'https://foodmenu.co.il/wp-json/wcfmmp/v1/store-vendors/' + store_id + '/products';      
        request.get({
          url: url,
          json: true,
          headers: {'User-Agent': 'request'}
        }, (err, res, data) => {
          if (err) {
            console.log('יש לך ארור יחנטריש: ', err);
          } else if (res.statusCode !== 200) {
            console.log('Status:', res.statusCode);
          } else {
            console.log(data);
            return data;
          }
        })
      },

      get: async function (store_id) {
        let url = 'https://foodmenu.co.il/wp-json/wcfmmp/v1/store-vendors/' + store_id; 
        request.get({
          url: url,
          json: true,
          headers: {'User-Agent': 'request'}
        }, (err, res, data) => {
          if (err) {
            console.log('יש לך ארור יחנטריש:', err);
          } else if (res.statusCode !== 200) {
            console.log('Status:', res.statusCode);
          } else {
            console.log(data);
            return data;
          }
        })
      }
    }

    api._products = {

      get_all: async function(){
        return await api.get("products", { per_page: 20 }).then((response) => {
          let items =[];          
          for (var i = response.data.length - 1; i >= 0; i--) {   

            /*
              let items = 
              [
              {
                id:0,
                name: 'avi',
                price: 50,
                job:
              }]
            */

            let imgs = [];
            let item = {};
            item.id = response.data[i]["id"];
            item.name = response.data[i]["name"];
            item.job = response.data[i]["description"];
            item.price = response.data[i]["regular_price"];
            if(response.data[i]["images"].length > 0){
              imgs.push(response.data[i]["images"][0]["src"])
            }
            item.images = imgs;
            items.push(item);
          }
          return items; 
        }).catch((error) => {
          console.log(error);
        });
      },      

      delete_all : async function(){
        api.get("products").then((response) => {
          for (var i = response.data.length - 1; i >= 0; i--) {          
            api._products.delete(response.data[i].id);
          }        
        }).catch((error) => {
          console.log(error);
        });
      },

      delete : async function(product_id) {
        api.delete("products/"+product_id, {force: true}).then((response) => {        
          console.log("Deleted:", response.data);  
        }).catch((error) => {
          console.log("Response Status:", error.response.status);
          console.log("Response Headers:", error.response.headers);
          console.log("Response Data:", error.response.data);
        }).finally(() => {})
      },

      add : async function(_product){        
        let product_id= _product.name;        
        api.post("products", _product).then((response) => {          
          console.log("Added: ", response.data);
        }).catch((error) => {
          console.log("Response Status:", error.response.status);
          console.log("Response Headers:", error.response.headers);      
          console.log("Response Data:", error.response.data);
        }).finally(() => {});
      },

      get : async function(product_id){
        api.get("products/" + product_id).then((response) => {
          console.log(response.data);
        }).catch((error) => {
          console.log(error);
        });
      }      
    }      

    app.get('/products', (req, res) => { 
      api._products.get_all().then((response) => {
        res.json(response);
      });    
    })

    app.listen(port, () => {})

    //wolt.fetch(imgs);
    // api._stores.get(7);
    // api._stores.get_all();
    // api._stores.get_products(9);
    // api._products.get(product_id);
    
    // api._products.add();
    // api._products.delete(product_id);
    // api._products.delete_all();
    // tenbis.get_restaurants_by_location('תל אביב');
  } 

  catch (error) {
    console.log(error);
  }      

})();





// ### code cemetery (R.I.P) ### //

  // api.get_products = async function(){
    //   api.get("products")
    //   .then((response) => {        
    //     console.log(response.data);
    //   }).catch((error) => {
    //     console.log(error);
    //   });
    // }

    // api.get_store = async function (_id) {
    //   let url = 'https://naturally.co.il/wp-json/wcfmmp/v1/store-vendors/' + _id; 
    //   request.get({
    //     url: url,
    //     json: true,
    //     headers: {
    //       'User-Agent': 'request'
    //     }
    //   }, (err, res, data) => {
    //     if (err) {
    //       console.log('Error:', err);
    //     } else if (res.statusCode !== 200) {
    //       console.log('Status:', res.statusCode);
    //     } else {
    //       console.log(data);
    //       return data;
    //     }
    //   })
    // }

    // api.get_store_products = async function (_id) {
    //   let url = 'https://naturally.co.il/wp-json/wcfmmp/v1/store-vendors/' + _id + '/products';      
    //   request.get({
    //     url: url,
    //     json: true,
    //     headers: {
    //       'User-Agent': 'request'
    //     }
    //   }, 
    //   (err, res, data) => {
    //     if (err) {
    //       console.log('Error:', err);
    //     } else if (res.statusCode !== 200) {
    //       console.log('Status:', res.statusCode);
    //     } else {
    //       console.log(data);
    //       return data;
    //     }
    //   })
    // }

    // api.get_stores = async function () {
    //   let url = 'https://naturally.co.il/wp-json/wcfmmp/v1/store-vendors'; // all
    //   request.get({
    //     url: url,
    //     json: true,
    //     headers: {
    //       'User-Agent': 'request'
    //     }
    //   }, 
    //   (err, res, data) => {
    //     if (err) {
    //       console.log('Error:', err);
    //     } else if (res.statusCode !== 200) {
    //       console.log('Status:', res.statusCode);
    //     } else {
    //       console.log(data);
    //       return data;
    //     }
    //   })
    // }    

    // api.get_product = async function(_id){
    //   api.get("products/" + _id).then((response) => {
    //     console.log(response.data);
    //   }).catch((error) => {
    //     console.log(error);
    //   });
    // }    

    // api.delete_all = async function(){      
    //   api.get("products")
    //   .then((response) => {
    //     for (var i = response.data.length - 1; i >= 0; i--) {          
    //       api.delete_product(response.data[i].id);
    //     }        
    //   }).catch((error) => {
    //     console.log(error);
    //   });
    // }

    // api.add_product = async function(_product){
    //   api.post("products", _product)
    //   .then((response) => {
    //       // Successful request          
    //       console.log("Success! Added: ", response.data);
    //     })
    //   .catch((error) => {
    //       // Invalid request, for 4xx and 5xx statuses    
    //       console.log("Response Status:", error.response.status);
    //       console.log("Response Headers:", error.response.headers);      
    //       console.log("Response Data:", error.response.data);
    //     })
    //   .finally(() => {});
    // }

    // api.delete_product = async function(_id) {
    //   api.delete("products/"+_id, {force: true}).then((response) => {        
    //     console.log("Successfully Deleted:", response.data);  
    //   })
    //   .catch((error) => {
    //     console.log("Response Status:", error.response.status);
    //     console.log("Response Headers:", error.response.headers);
    //     console.log("Response Data:", error.response.data);
    //   }).finally(() => {})
    // }