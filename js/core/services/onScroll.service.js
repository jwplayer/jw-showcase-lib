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

(function () {

    angular
        .module('jwShowcase.core')
        .service('onScroll', onScroll);

    /**
     * @ngdoc service
     * @name jwShowcase.core.onScroll
     *
     * @description
     * Better swipe service with support for mouse leave
     */
    onScroll.$inject = ['$timeout'];
    function onScroll ($timeout) {

        function getScrollTop() {
            return window.pageYOffset || document.body.scrollTop;
        }

        this.bind = function(callback, debounceTime) {
            if (typeof debounceTime === 'undefined') {
                // default to 100ms
                debounceTime = 100;
            }

            var clear;
            var raf = window.requestAnimationFrame;

            // if browser support animation frame
            if (raf) {
                var af;
                var lastScrollTop = getScrollTop();

                var loop = function() {
                    var scrollTop = getScrollTop();

                    if (lastScrollTop !== scrollTop) {
                        lastScrollTop = scrollTop;

                        // fire callback function if scrolled
                        callback();
                    }

                    // continue loop
                    af = raf(loop);
                };

                // start loop
                loop();

                clear = function() {
                    cancelAnimationFrame(af);
                };
            } else {
                // fallback to oldskool scroll event listener
                var waiting = false;
                var endScrollHandle;

                // debounce the event handler to improve performance
                var debouncedHandler = function () {
                    if (waiting) {
                        return;
                    }

                    waiting = true;

                    // clear previously scheduled endScrollHandle
                    clearTimeout(endScrollHandle);

                    callback();

                    // stop waiting after debounceTime
                    $timeout(function () {
                        waiting = false;
                    }, debounceTime);

                    // in case scroll happened while we were waiting, fire callback after twice the debounceTime
                    endScrollHandle = $timeout(function () {
                        callback();
                    }, debounceTime * 2);
                };

                // set listener and handler
                window.addEventListener('scroll', debouncedHandler);

                clear = function() {
                    // remove listener
                    window.removeEventListener('scroll', debouncedHandler);
                };
            }

            // return 'API'
            return {
                clear: clear
            };
        };

    }

}());
