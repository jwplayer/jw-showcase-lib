/**
 * Copyright 2017 Longtail Ad Solutions Inc.
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
        .directive('jwAdSlot', jwAdSlot);

    jwAdSlot.$inject = ['config', 'dfp', 'utils', 'platform'];
    function jwAdSlot (config, dfp, utils, platform) {
        return {
            bindToController: true,
            controller:       angular.noop,
            controllerAs:     'vm',
            link:             link,
            restrict:         'E',
            replace:          true,
            template:         '<div></div>',
            scope:            {
                slotId: '@'
            }
        };

        function link (scope, element, attrs) {

            var screenSize = platform.screenSize();

            activate();

            ///////////

            /**
             * Initialize directive
             */
            function activate () {

                var slot            = dfp.getSlot(attrs.slotId),
                    resizeDebounced = utils.debounce(resize, 10);

                if (slot) {
                    element.attr('id', attrs.slotId);
                    dfp.display(attrs.slotId);
                    window.addEventListener('resize', resizeDebounced);
                }
            }

            /**
             * Resize handler
             */
            function resize () {

                var newScreenSize = platform.screenSize();
                var slot          = dfp.getSlot(attrs.slotId);

                // only refresh when screenSize changes
                if (slot && screenSize !== newScreenSize) {
                    screenSize = newScreenSize;
                    dfp.refresh(slot);
                }
            }
        }
    }

}());
