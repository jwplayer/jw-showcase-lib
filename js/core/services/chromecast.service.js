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

  chromecast.$inject = ['$rootScope', '$timeout', '$interval'];

  function chromecast($rootScope, $timeout, $interval) {
    var self = this;
    // Private variables
    var session = null,
      eventCallbacks = {};


    // Player variables
    var currentPlaylist = null,
      currentMedia = null,
      currentIndexOfMedia = 0,
      firstPlay = false,
      endOfMovieMode = false;

    // Public functions
    this.connect = connect;
    this.disconnect = disconnect;
    this.on = on;
    this.once = once;
    this.setSettings = setSettings;
    this.isConnected = false;

    // Player functions
    this.play = play;
    this.pause = pause;
    this.stop = stop;
    this.seek = seek;
    this.playlistItem = playlistItem;
    this.setCurrentQuality = setCurrentQuality;
    this.load = load;
    this.remove = remove;


    // Needed for interaction
    function initializeApi() {
      var sessionRequest = new chrome.cast.SessionRequest(CHROME_CAST_APPLICATION_ID, []);
      var apiConfig = new chrome.cast.ApiConfig(sessionRequest, sessionListener, receiverListener);
      chrome.cast.initialize(apiConfig, onInitSuccess, onError);
    }

    initializeApi();

    function connect() {
      $rootScope.$emit('chromecast:connecting');
      chrome.cast.requestSession(chromecastConnected, function (error) {
        $rootScope.$emit('chromecast:available');
        onError(error);
      });
    }

    function disconnect() {
      if (session) {
        session.leave(function () {
          $rootScope.$emit('chromecast:available');
          self.isConnected = false;

        });
      }
    }

    function parseMediaObject(media) {
      return {
        "contentId": media.sources[0].file,
        "streamType": "BUFFERED",
        "contentType": media.sources[0].type,
        "metadata": {
          "metadataType": 0,
          "images": [
            {
              "url": media.image,
              "width": 300,
              "height": 250
            }
          ],
          "title": media.title,
          "subtitle": media.description
        },
        "duration": null,
        "customData": {
          "mediaid": media.mediaid
        }
      };
    }

    function setSettings(settings) {
      if (settings.playlist) {
        load(settings.playlist);
        playlistItem(0);
        if (settings.autostart) {
          play();
        }
      }
    }

    // Listeners
    function onInitSuccess(session) {

    }

    function receiverListener(receiverAvailability) {
      console.log('receiverAvailability: ', receiverAvailability);
      // If there is no chromecast receiver available we will try again.
      if (receiverAvailability === chrome.cast.ReceiverAvailability.UNAVAILABLE) {
        $rootScope.$emit('chromecast:unavailable');
        $timeout(initializeApi(), 500);
      }

      if (receiverAvailability === chrome.cast.ReceiverAvailability.AVAILABLE) {
        $rootScope.$emit('chromecast:available');
      }
    }

    function sessionListener(changedData) {

    }

    function chromecastConnected(createdSession) {
      console.log('Session created', createdSession);
      // Can become one function
      $rootScope.$emit('chromecast:connected');
      self.isConnected = true;
      session = createdSession;
    }



    function mediaUpdateListener() {
      switch (currentMedia.playerState) {
        case 'PLAYING':
          trigger('play');
          if (!firstPlay) {
            firstPlay = true;
            trigger('levels', {levels: [{}, {}], currentQuality: ''});
            trigger('firstFrame');
          }
          break;
        case 'PAUSED':
          trigger('pause');
          break;
        case 'BUFFERING':
          trigger('buffering');
          break;
        case 'IDLE':
          // Because the receiver does not send a idle reason we have to detect the end of the video by comparing the
          // duration and the current time of the video
          if(currentMedia.media.duration === currentMedia.getEstimatedTime()) {
            // End of movie mode is detected because the library triggers the event twice at the end of a video
            if(!endOfMovieMode) {
                trigger('complete');
                playlistItem(currentIndexOfMedia + 1);
              }
              endOfMovieMode = true;
          }
      }
    }

    function onError(error) {
      console.error(error);
      trigger('error');
    }


    // Player actions
    function play() {
      currentMedia.play();
    }

    function pause() {
      currentMedia.pause();
    }

    function stop() {
      // Sets video back to the begin in jwplayer
      currentMedia.stop();
    }

    function seek(position) {
      // Jump to the specified position within the currently playing item.
      var seekRequest = new chrome.cast.media.SeekRequest();
      seekRequest.currentTime = Math.floor(position);
      seekRequest.resumeState = null;
      seekRequest.customData = null;
      trigger('seek');

      currentMedia.seek(seekRequest);
    }

    function playlistItem(index) {

      trigger('playlistItem', {index: currentIndexOfMedia, item: currentPlaylist[currentIndexOfMedia]});

      // Start playback of the playlist item at the specified index.
      var requestedMedia = currentPlaylist[index];
      // Now load in in to the chromecast
      var request = new chrome.cast.media.LoadRequest(parseMediaObject(requestedMedia));
      session.loadMedia(request, function (media) {
        firstPlay = false;
        currentMedia = media;
        currentIndexOfMedia = index;
        media.addUpdateListener(mediaUpdateListener);
        endOfMovieMode = false;
      });
    }

    function setCurrentQuality(index) {
      // Change the quality level to the provided index. The index must not exceed the amount of available qualities.
      // TODO ask Christiaan
    }

    function load(playlist) {
      // Loads a new playlist into the player.
      currentPlaylist = playlist;
      // TODO shoud be on an other moment
      trigger('ready');
    }

    function remove() {

    }


    // Keep firing events for the time
    function fireTimeEvent() {
      if (currentMedia && currentMedia.playerState === 'PLAYING') {
        var position = currentMedia.getEstimatedTime();
        trigger('time', {duration: currentMedia.media.duration, position: position});
      }
    }

    $interval(fireTimeEvent, 250);

    // Registering event listeners
    function on(type, aCallback) {
      if (!eventCallbacks[type]) {
        eventCallbacks[type] = [];
      }
      eventCallbacks[type].push(aCallback);
    }

    function once(type, aCallback) {
      eventCallbacks[type].push(function () {
        //aCallback.apply(self, arguments);
        aCallback();
        aCallback = angular.noop;
      });
    }

    function trigger(type, object) {
      if (eventCallbacks && eventCallbacks[type]) {
        eventCallbacks[type].forEach(function (callback) {
          callback(object);
        });
      }
    }
  }
})