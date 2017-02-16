/**
 * Copyright 2015 Longtail Ad Solutions Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 **/

/*globals chrome:false, angular:false, console:false*/

(function () {
  var CHROME_CAST_APPLICATION_ID = 'EF46CC40';

  angular
    .module('jwShowcase.core')
    .service('chromecast', chromecast);

  chromecast.$inject = ['$timeout'];

  function chromecast ($timeout) {



    // Private variables
    var session = null;

    function initializeApi () {
      var sessionRequest = new chrome.cast.SessionRequest(CHROME_CAST_APPLICATION_ID, []);
      var apiConfig = new chrome.cast.ApiConfig(sessionRequest, sessionListener, receiverListener);
      chrome.cast.initialize(apiConfig, onInitSuccess, onError);
    }

    initializeApi();

    function connect () {
      chrome.cast.requestSession(chromecastConnected, onError);
    }

    // Listeners
    function onInitSuccess(session) {

    }

    function receiverListener (receiverAvailability) {
      console.log('receiverAvailability: ', receiverAvailability);
      // If there is no chromecast receiver available we will try again.
      if (receiverAvailability === chrome.cast.ReceiverAvailability.UNAVAILABLE) {
        $timeout(initializeApi(), 500);
      }

      //TODO: Remove, just for testing purposes
      if (receiverAvailability === chrome.cast.ReceiverAvailability.AVAILABLE) {
        $timeout(function () {connect();}, 5000);
      }
    }

    function sessionListener (changedData) {

    }

    function chromecastConnected (createdSession) {
      console.log('Session created', createdSession);
      session = createdSession;
    }

    function onError(error) {
      console.error(error);
    }

  }
})