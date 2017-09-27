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
    onScroll.$inject = ['$timeout', 'utils'];
    function onScroll ($timeout, utils) {


        this.bind = function(callback, opts) {
            if (!opts) {
                opts = {};
            }

            opts.debounceTime = opts.debounceTime || 100;
            opts.debounceResize = opts.debounceResize || false;

            var clear;
            var resizing = false;
            var resizeTimeout;
            var lastScrollTop = utils.getScrollTop();

            var resizeHandler = utils.debounce(function () {
                resizing = true;

                $timeout.cancel(resizeTimeout);

                resizeTimeout = $timeout(function () {
                    resizing = false;
                }, opts.debounceResize);
            }, 50);

            var raf = window.requestAnimationFrame;

            // if browser support animation frame
            if (raf) {
                var af;

                var loop = function() {
                    var scrollTop = utils.getScrollTop();

                    if (lastScrollTop !== scrollTop && !resizing) {
                        lastScrollTop = scrollTop;

                        // fire callback function if scrolled
                        callback(scrollTop, scrollTop > lastScrollTop);
                    }

                    // continue loop
                    af = raf(loop);
                };

                // start loop
                loop();

                clear = function() {
                    cancelAnimationFrame(af);
                    window.removeEventListener('resize', resizeHandler);
                };
            } else {
                // fallback to oldskool scroll event listener
                var waiting = false;
                var endScrollTimeout;

                // debounce the event handler to improve performance
                var debouncedHandler = function () {
                    if (waiting || resizing) {
                        return;
                    }

                    waiting = true;

                    var scrollTop = utils.getScrollTop();
                    var scrolledDown = scrollTop > lastScrollTop;

                    // clear previously scheduled endScrollTimeout
                    $timeout.cancel(endScrollTimeout);

                    callback(scrollTop, scrolledDown);

                    // stop waiting after debounceTime
                    $timeout(function () {
                        waiting = false;
                    }, opts.debounceTime);

                    // in case scroll happened while we were waiting, fire callback after twice the debounceTime
                    endScrollTimeout = $timeout(function () {
                        callback(scrollTop, scrolledDown);
                    }, opts.debounceTime * 2);

                    lastScrollTop = scrollTop;
                };

                // set listener and handler
                window.addEventListener('scroll', debouncedHandler);

                clear = function() {
                    // remove listener
                    window.removeEventListener('scroll', debouncedHandler);
                    window.removeEventListener('resize', resizeHandler);
                };
            }

            if (opts.debounceResize) {
                window.addEventListener('resize', resizeHandler);
            }

            // return 'API'
            return {
                clear: clear
            };
        };

    }

}());
