const request = require('request');
const notifier = require('node-notifier');

var tcKimlik = "";
var sifre = "";


//Login and Get a JWT Named bearer token
function loginAndFetchJWT() {
  //Setting up login options
  const loginOptions = {
    method: 'POST',
    url: 'https://prd.mhrs.gov.tr/api/vatandas/login',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "kullaniciAdi": tcKimlik,
      "parola": sifre,
      "islemKanali": "VATANDAS_WEB",
      "girisTipi": "PAROLA",
      "captchaKey": null
    })
  };
  //Create request to prd.mhrs.gov.tr for login and get a token.
  request(loginOptions, function (error, response, body) {
    //Check if any error happens
    if (error) throw new Error(error);
    //Convert body to Json Data
    const jsonData = JSON.parse(body);
    //Check jsonData.jwt for login
    if (jsonData.data.jwt) {
      //Send and start to fetch function
      fetchAppointments(jsonData.data.jwt); 
    } else {
      //if jwt is null try again after 10 min
      setTimeout(loginAndFetchJWT, 10 * 60 * 1000);
    }
  });
}
//Fetch appointments and send notification
function fetchAppointments(jwt) {
  //Setting up appointment options
  const appointmentOptions = {
    method: 'POST',
    url: 'https://prd.mhrs.gov.tr/api/kurum-rss/randevu/slot-sorgulama/arama',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}` 
    },
    body: JSON.stringify({
      "aksiyonId": "200",
      "cinsiyet": "F",
      "mhrsHekimId": -1,
      "mhrsIlId": -1,
      "mhrsIlceId": -1,
      "mhrsKlinikId": -1,
      "mhrsKurumId": -1,
      "muayeneYeriId": -1,
      "tumRandevular": false,
      "ekRandevu": true,
      "randevuZamaniList": []
    })
  };
  //Create request to prd.mhrs.gov.tr for check appointments.
  request(appointmentOptions, function (error, response, body) {
    //Check if any error happens
    if (error) throw new Error(error);
    //Convert body to json data
    const data = JSON.parse(body);
    //Check data is avaiable and infos.kodu is RND4000 because RND4000 is they have a appointments.
    if (data && data.infos.kodu == "RND4000") {
      //Send nofity to user
      notifier.notify({
        title: 'Randevu Bulundu!',
        message: 'Randevu mevcut, lütfen kontrol edin.',
        sound: true
      });
    } else {
      //If no appointments found just start again after 10min. 
      setTimeout(loginAndFetchJWT, 10 * 60 * 1000);
    }
  });
}

// First time start and call the function
loginAndFetchJWT();
