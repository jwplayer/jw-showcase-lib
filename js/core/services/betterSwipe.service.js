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
        .service('betterSwipe', betterSwipe);

    /**
     * @ngdoc service
     * @name jwShowcase.core.betterSwipe
     *
     * @description
     * Better swipe service with support for mouse leave
     */
    betterSwipe.$inject = ['$swipe'];
    function betterSwipe ($swipe) {

        function pipeHandler(handler, scope, args) {
            if (!handler) {
                return;
            }

            return handler.apply(scope, args);
        }

        this.bind = function(element, handlers) {
            var active = false;
            var enabled = true;

            // call ngTouch's $swipe.bind
            $swipe.bind(element, {
                start: function() {
                    if (!enabled) {
                        return;
                    }

                    active = true;

                    pipeHandler(handlers.start, this, arguments);
                },
                move: function() {
                    if (!(active && enabled)) {
                        return;
                    }

                    // allow handler to return boolean to (de)activate this move handler
                    var result = pipeHandler(handlers.move, this, arguments);
                    if (typeof result !== 'undefined') {
                        // cast to boolean
                        active = !!result;
                    }
                },
                end: function() {
                    active = false;

                    pipeHandler(handlers.end, this, arguments);
                },
                cancel: function() {
                    active = false;

                    pipeHandler(handlers.cancel, this, arguments);
                }
            });

            // add support for 'mouse' leave event
            if (handlers.leave) {
                element.on('mouseleave touchleave', function() {
                    // deactivate when 'mouse' leaves element
                    active = false;

                    pipeHandler(handlers.leave, this, arguments);
                });
            }

            // return new object which acts as API
            return {
                // allow manual activation of handlers
                enable: function(state) {
                    enabled = state;
                }
            };
        };

    }

}());
