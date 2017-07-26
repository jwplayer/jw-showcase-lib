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
        .service('dfp', dfp);

    /**
     * @ngdoc service
     * @name jwShowcase.core.dfp
     */
    dfp.$inject = ['$q'];
    function dfp ($q) {

        var gptScript    = 'https://www.googletagservices.com/tag/js/gpt.js',
            gptLoaded    = false,
            dfp          = this,
            definedSlots = {};

        this.slots       = {};
        this.sizeMapping = {};

        this.defineSlot        = defineSlot;
        this.defineSizeMapping = defineSizeMapping;
        this.getSlot           = getSlot;
        this.display           = display;
        this.execute           = execute;
        this.refresh           = refresh;
        this.destroy           = destroy;

        ////////////////

        /**
         * @ngdoc method
         * @name jwShowcase.core.dfp#defineSlot
         * @methodOf jwShowcase.core.dfp
         *
         * @returns {jwShowcase.core.dfp}
         */
        function defineSlot (tag, size, id) {

            this.slots[id] = {
                tag:  tag,
                size: size
            };

            return this;
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.dfp#defineSizeMapping
         * @methodOf jwShowcase.core.dfp
         *
         * @returns {jwShowcase.core.dfp}
         */
        function defineSizeMapping (mapping, id) {

            // to match css mediaQueries with sizeMapping breakpoints the scrollbar width must be subtracted.
            var scrollbarWidth = window.innerWidth - document.body.clientWidth;

            // but only when scrollbar is visible
            if (scrollbarWidth > 0) {
                mapping = mapping.map(function (size) {
                    if (size[0][0] > 0) {
                        size[0][0] = size[0][0] - scrollbarWidth;
                    }
                    return size;
                });
            }

            this.sizeMapping[id] = mapping;

            return this;
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.dfp#display
         * @methodOf jwShowcase.core.dfp
         */
        function display (id) {

            googletag.cmd.push(function () {
                googletag.display(id);
            });
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.dfp#getSlot
         * @methodOf jwShowcase.core.dfp
         *
         * @returns {Object|undefined}
         */
        function getSlot (id) {

            return definedSlots[id];
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.dfp#refresh
         * @methodOf jwShowcase.core.dfp
         */
        function refresh (slot) {

            googletag.cmd.push(function () {
                googletag.pubads().refresh([slot]);
            });
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.dfp#display
         * @methodOf jwShowcase.core.dfp
         */
        function destroy (slot) {

            googletag.cmd.push(function () {
                googletag.destroySlots([slot]);
            });
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.dfp#execute
         * @methodOf jwShowcase.core.dfp
         *
         * @returns {jwShowcase.core.dfp}
         */
        function execute () {

            loadDfpScript().then(function () {

                googletag.cmd.push(function () {
                    angular.forEach(dfp.slots, function (slot, id) {
                        definedSlots[id] = googletag
                            .defineSlot(slot.tag, slot.size, id)
                            .addService(googletag.pubads());

                        if (dfp.sizeMapping[id]) {
                            definedSlots[id].defineSizeMapping(dfp.sizeMapping[id]);
                        }
                    });

                    googletag.pubads().enableSingleRequest();
                    googletag.pubads().collapseEmptyDivs(true);
                    googletag.pubads().setCentering(true);
                    googletag.enableServices();
                });

            });

            return this;
        }

        /**
         * Load DFP script
         */
        function loadDfpScript () {

            var defer,
                script;

            if (gptLoaded) {
                return $q.resolve();
            }

            defer  = $q.defer();
            script = document.createElement('script');

            script.type = 'text/javascript';

            script.onload = function () {
                gptLoaded = true;
                defer.resolve();
            };

            script.onerror = function () {
                defer.reject('Could not load dfp library, ad blockers?');
            };

            script.async = true;
            script.src   = gptScript;
            document.body.appendChild(script);

            return defer.promise;
        }
    }

}());
