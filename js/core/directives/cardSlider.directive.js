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
        .directive('jwCardSlider', cardSliderDirective);

    /**
     * @ngdoc directive
     * @name jwShowcase.core.directive:jwCardSlider
     * @module jwShowcase.core
     *
     * @description
     * # jwCardSlider
     * The `jwCardSlider` can be used to create a horizontal list of cards which can be moved horizontally. Each item
     * will be rendered in the {@link jwShowcase.core.directive:jwCard `jwCard`} directive.
     *
     * @scope
     *
     * @param {jwShowcase.core.feed}    feed            Feed which will be displayed in the slider.
     * @param {Object|number=}          cols            How many columns should be visible. Can either be a fixed number
     *                                                  or an object with responsive columns (e.g. `{sm: 2, md: 4}`).
     *                                                  Available sizes; xs, sm, md, lg and xl.
     *
     * @param {boolean=}                featured        Featured slider flag
     * @param {function=}               onCardClick     Function which is being called when the user clicks on a card.
     * @param {object=}                 delegate        Exposes a small api to control the cardSlider.
     * @param {string=}                 title           Overrule title from {@link jwShowcase.core.feed}
     *
     * @requires $compile
     * @requires $templateCache
     * @requires jwShowcase.core.utils
     *
     * @example
     *
     * ```
     * <jw-card-slider feed="vm.feed" cols="1" featured="true"></jw-card-slider>
     * <jw-card-slider feed="vm.feed" cols="{xs: 2, sm: 3}" featured="false" heading="'Videos'"></jw-card-slider>
     * ```
     */
    cardSliderDirective.$inject = ['$compile', '$templateCache', 'utils'];
    function cardSliderDirective ($compile, $templateCache, utils) {

        return {
            scope:            {
                feed:        '=',
                cols:        '=',
                featured:    '=',
                onCardClick: '=',
                title:       '@',
                delegate:    '=?'
            },
            replace:          true,
            controller:       angular.noop,
            controllerAs:     'vm',
            bindToController: true,
            templateUrl:      'views/core/cardSlider.html',
            link:             link
        };

        function link (scope, element) {

            var sliderList             = findElements('.jw-card-slider-list'),
                resizeHandlerDebounced = utils.debounce(resizeHandler, 100),
                slideTemplate          = $templateCache.get('views/core/cardSliderSlide.html'),
                index                  = 0,
                leftSlidesVisible      = false,
                sliderCanSlide         = false,
                sliding                = false,
                userIsSliding          = false,
                startCoords            = {},
                sliderMap              = [],
                totalItems             = 0,
                itemsVisible           = 0,
                itemsMargin            = 1,
                options                = {
                    sliderBackgroundColor: null
                },
                animation;

            scope.vm.slideLeft  = slideLeft;
            scope.vm.slideRight = slideRight;

            activate();

            /**
             * Initialize the directive.
             */
            function activate () {

                var classNameSuffix = scope.vm.featured ? 'featured' : 'default',
                    className       = 'jw-card-slider-flag-' + classNameSuffix,
                    loading         = scope.vm.feed.loading;

                setCustomOptions();

                element.addClass(className);

                if (!scope.vm.featured) {
                    scope.vm.heading = scope.vm.title || scope.vm.feed.title || 'loading';
                }
                else {
                    findElement('.jw-card-slider-indicator').removeClass('ng-hide');
                }

                scope.$on('$destroy', destroyHandler);
                window.addEventListener('resize', resizeHandlerDebounced);
                findElement('.jw-card-slider-align')[0].addEventListener('touchstart', onTouchStart, false);

                scope.$watch(function () {
                    return scope.vm.feed;
                }, feedUpdateHandler, true);

                if (scope.vm.feed) {
                    totalItems = scope.vm.feed.playlist.length;
                }

                if (loading) {
                    element.addClass('jw-card-slider-flag-loading');
                    renderLoadingSlides();
                }

                resizeHandler();
            }

            /**
             * Find child element by selector
             * @param {string} selector
             * @returns {Object}
             */
            function findElement (selector) {

                return angular.element(element[0].querySelector(selector));
            }

            /**
             * Find child elements by selector
             * @param {string} selector
             * @returns {Object}
             */
            function findElements (selector) {

                return angular.element(element[0].querySelectorAll(selector));
            }

            /**
             * Clean up
             */
            function destroyHandler () {

                window.removeEventListener('resize', resizeHandlerDebounced);
                findElement('.jw-card-slider-align')[0].removeEventListener('touchstart', onTouchStart);
            }

            /**
             * Gets called when the feed gets updated
             */
            function feedUpdateHandler (newValue, oldValue) {

                setCustomOptions();

                // set slider background color
                element.css('background-color', options.sliderBackgroundColor || '');

                if (!feedHasChanged(newValue, oldValue)) {
                    return;
                }

                if (!scope.vm.featured) {
                    scope.vm.heading = scope.vm.title || scope.vm.feed.title;
                }

                totalItems = scope.vm.feed.playlist.length;

                element.toggleClass('jw-card-slider-flag-loading', scope.vm.feed.loading);

                resizeHandler(true);
            }

            /**
             * Set custom options from feed
             */
            function setCustomOptions () {

                var custom;

                angular.forEach(options, function (val, key) {

                    custom = scope.vm.feed['showcase.' + key];

                    if (angular.isDefined(custom)) {
                        if ('true' === custom || 'false' === custom) {
                            options[key] = 'true' === custom;
                        }
                        else {
                            options[key] = custom;
                        }
                    }
                });
            }

            /**
             * Returns true if the feeds has changed and needs to re render
             * @param {jwShowcase.core.feed} newValue
             * @param {jwShowcase.core.feed} oldValue
             * @returns {boolean}
             */
            function feedHasChanged (newValue, oldValue) {

                return !comparePlaylist(newValue.playlist, oldValue.playlist) || !!newValue.error;
            }

            /**
             * Compare the two given playlists on their $key property
             * @param {jwShowcase.core.item[]} playlist
             * @param {jwShowcase.core.item[]} prevPlaylist
             * @returns {boolean}
             */
            function comparePlaylist (playlist, prevPlaylist) {

                var playlistMap     = playlist.map(function (item) {
                        return item.$key;
                    }),
                    prevPlaylistMap = prevPlaylist.map(function (item) {
                        return item.$key;
                    });

                return angular.equals(playlistMap, prevPlaylistMap);

            }

            /**
             * Handle resize event
             */
            function resizeHandler (forceRender) {

                var newItemsVisible = angular.isNumber(scope.vm.cols) ? scope.vm.cols :
                        utils.getValueForScreenSize(scope.vm.cols, 1),
                    needsRender     = newItemsVisible !== itemsVisible;

                itemsVisible   = newItemsVisible;
                itemsMargin    = newItemsVisible + 1;
                sliderCanSlide = totalItems > itemsVisible;

                sliderList.attr('class', 'jw-card-slider-list slides-' + itemsVisible);

                leftSlidesVisible = scope.vm.featured;

                if (!sliderCanSlide) {
                    index             = 0;
                    leftSlidesVisible = false;
                }

                findElements('.jw-card-slider-button').toggleClass('ng-hide', !sliderCanSlide);

                if (forceRender || needsRender) {

                    if (scope.vm.feed.error) {
                        renderErrorSlides();
                    }
                    else if (scope.vm.feed.loading) {
                        renderLoadingSlides();
                    }
                    else {
                        renderSlides();
                    }
                }

                moveSlider(0, false);
            }

            /**
             * Render custom slides
             * @param {string} templateUrl
             * @parma {number} count
             */
            function renderCustomSlides (templateUrl, count) {

                var holder   = angular.element('<div></div>'),
                    template = $templateCache.get(templateUrl),
                    dummy;

                count = count || 5;

                for (var i = 0; i < count; i++) {
                    dummy = angular.element(template);
                    dummy.children().eq(0).addClass('jw-card-flag-' + (scope.vm.featured ? 'featured' : 'default'));
                    holder.append(dummy);
                }

                sliderList
                    .html('')
                    .append(holder.children());
            }

            /**
             * Render loading slides
             */
            function renderLoadingSlides () {

                renderCustomSlides('views/core/cardSliderDummySlide.html', 6);

                element.addClass('jw-card-slider-flag-loading');
            }

            /**
             * Render error slides
             */
            function renderErrorSlides () {

                renderCustomSlides('views/core/cardSliderErrorSlide.html', 6);

                scope.vm.heading = 'Missing feed';

                element.addClass('jw-card-slider-flag-error');
            }

            /**
             * Render slides
             */
            function renderSlides () {

                var itemIndex     = index,
                    totalCols     = itemsVisible + itemsMargin,
                    prevNode      = null,
                    nextSliderMap = [],
                    item, slide;

                if (leftSlidesVisible) {
                    itemIndex -= itemsMargin;
                    totalCols += itemsMargin;
                }

                if (itemIndex < 0) {
                    itemIndex += totalItems;
                }

                for (var slideIndex = 0; slideIndex < totalCols; slideIndex++) {

                    if (itemIndex > totalItems - 1) {
                        if (!sliderCanSlide) {
                            break;
                        }

                        itemIndex -= totalItems;
                    }

                    item  = scope.vm.feed.playlist[itemIndex];
                    slide = findExistingSlide(item) || createSlide(item);

                    addClassNamesToSlide(slide);
                    addSlideToSliderList(slide);

                    prevNode = slide;
                    itemIndex++;
                }

                destroySlides();

                sliderMap = nextSliderMap;

                updateIndicator();
                updateVisibleSlides();
                findElement('.jw-card-slider-button-flag-left').toggleClass('is-disabled', !leftSlidesVisible);

                ///////////

                function createSlide () {

                    var slide = compileSlide(item);
                    nextSliderMap.push({
                        key: item.$key,
                        el:  slide
                    });

                    return slide;
                }

                function addSlideToSliderList () {

                    if (prevNode) {
                        return prevNode.after(slide);
                    }

                    sliderList.prepend(slide);
                }

                function addClassNamesToSlide () {

                    slide.removeClass('first last');

                    if (itemIndex === 0) {
                        slide.addClass('first');
                    }
                    else if (itemIndex === totalItems - 1) {
                        slide.addClass('last');
                    }

                }

                function findExistingSlide (item) {

                    var mapIndex = sliderMap.length;
                    while (mapIndex--) {
                        if (sliderMap[mapIndex].key === item.$key) {
                            slide = sliderMap[mapIndex].el;
                            nextSliderMap.push(sliderMap[mapIndex]);
                            sliderMap.splice(mapIndex, 1);
                            return slide;
                        }
                    }
                }

                function destroySlides () {

                    sliderMap.forEach(function (item) {
                        if (item.el.scope()) {
                            item.el.scope().$destroy();
                        }
                        item.el.remove();
                    });
                }
            }

            /**
             * Update the slider indicator
             */
            function updateIndicator () {

                var indicator = findElement('.jw-card-slider-indicator'),
                    children  = indicator.children();

                if (!scope.vm.featured) {
                    return;
                }

                // re-render dots if length mismatches
                if (children.length !== totalItems) {

                    indicator.html('');

                    for (var i = 0; i < totalItems; i++) {
                        indicator.append(angular.element('<div class="jw-card-slider-indicator-dot"></div>'));
                    }
                }

                // update active dot
                indicator
                    .children()
                    .removeClass('is-active')
                    .eq(index)
                    .addClass('is-active');
            }

            /**
             * Set visible classNames to slides
             * @param {number} [offset=0]
             */
            function updateVisibleSlides (offset) {

                var from = leftSlidesVisible ? itemsMargin : 0,
                    to   = from + itemsVisible;

                if (angular.isNumber(offset)) {
                    from += offset;
                    to += offset;
                }

                angular.forEach(findElement('.jw-card-slider-list').children(), function (slide, slideIndex) {
                    slide.classList.toggle('is-visible', slideIndex >= from && slideIndex < to);
                });
            }

            /**
             * Compile a slide
             * @param {jwShowcase.core.item} item
             * @returns {angular.element}
             */
            function compileSlide (item) {

                var childScope = scope.$new(false, scope);

                childScope.item = item;

                return $compile(angular.element(slideTemplate))(childScope);
            }

            /**
             * Slide to the left
             */
            function slideLeft () {

                var toIndex   = index === 0 ? totalItems - itemsVisible : Math.max(0, index - itemsVisible),
                    slideCols = index - toIndex;

                if (sliding || !leftSlidesVisible) {
                    return;
                }

                if (slideCols < 0) {
                    slideCols = (index + totalItems) - toIndex;
                }

                index = toIndex;

                updateVisibleSlides(-slideCols);

                moveSlider((slideCols / itemsVisible) * 100, true, function () {
                    renderSlides();
                    moveSlider(0, false);
                });
            }

            /**
             * Slide to the right
             */
            function slideRight () {

                var toIndex   = index + itemsVisible,
                    maxIndex  = totalItems - itemsVisible,
                    slideCols = itemsVisible;

                if (sliding) {
                    return;
                }

                if (index === maxIndex) {
                    toIndex = 0;
                }
                else if (toIndex >= maxIndex) {
                    toIndex   = maxIndex;
                    slideCols = toIndex - index;
                }

                index = toIndex;

                updateVisibleSlides(slideCols);

                moveSlider(((slideCols / itemsVisible) * 100) * -1, true, function () {

                    leftSlidesVisible = true;

                    renderSlides();
                    moveSlider(0, false);
                });
            }

            /**
             * Move the slider to the given offset with or without animation.
             * @param {number} offset Offset
             * @param {boolean} animate Animate flag
             * @param {Function} [callback] Callback when slider has moved
             */
            function moveSlider (offset, animate, callback) {

                var listElement = findElement('.jw-card-slider-list');

                sliding = true;

                if (animation && animation._active) {
                    animation.kill();
                }

                if (leftSlidesVisible) {
                    offset -= itemsMargin / itemsVisible * 100;
                }

                animation = window.TweenLite
                    .to(listElement, animate ? 0.3 : 0, {
                        x: offset + '%', z: 0.01, onComplete: onSlideComplete
                    });

                function onSlideComplete () {

                    sliding = false;

                    setTimeout(function () {
                        if (angular.isFunction(callback)) {
                            callback();
                        }
                    }, 1);
                }
            }

            /**
             * Handle touchstart event
             * @param {Event} event
             * @todo detect isAndroid4
             */
            function onTouchStart (event) {

                var isAndroid4     = false,
                    coords         = getCoords(event),
                    touchContainer = findElement('.jw-card-slider-align')[0];

                touchContainer.addEventListener('touchmove', onTouchMove);
                touchContainer.addEventListener('touchend', onTouchEnd);
                touchContainer.addEventListener('touchcancel', onTouchCancel);

                startCoords = coords;
                element.addClass('is-sliding');

                if (true === isAndroid4) {
                    event.preventDefault();
                }
            }

            /**
             * Handle touchmove event
             * @param {Event} event
             */
            function onTouchMove (event) {

                var coords         = getCoords(event),
                    distanceX      = startCoords.x - coords.x,
                    distanceY      = startCoords.y - coords.y,
                    deltaX         = Math.abs(distanceX),
                    deltaY         = Math.abs(distanceY),
                    sliderWidth    = findElement('.jw-card-slider-list')[0].offsetWidth,
                    containerWidth = findElement('.jw-card-slider-container')[0].offsetWidth;

                if (animation && animation._active) {
                    return;
                }

                if (!userIsSliding) {
                    if (deltaY > 20) {
                        afterTouchEnd();
                        moveSlider(0, true);
                    }
                    else if (deltaX > 20) {
                        userIsSliding = true;
                    }
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                // first item
                if (!leftSlidesVisible && distanceX < 0) {
                    distanceX = Math.min(50, easeOutDistance(deltaX, containerWidth)) * -1;
                }
                // last item
                else if (!sliderCanSlide && distanceX > 0) {
                    distanceX = Math.min(50, easeOutDistance(deltaX, containerWidth));
                }

                var percentageOffset = (distanceX / sliderWidth) * 100;

                moveSlider(-percentageOffset, false);
            }

            /**
             * Handle touchend event
             * @param {Event} event
             */
            function onTouchEnd (event) {

                var coords   = getCoords(event),
                    distance = startCoords.x - coords.x;

                if (distance < -50 && leftSlidesVisible) {
                    slideLeft();
                }
                else if (distance > 50 && sliderCanSlide) {
                    slideRight();
                }
                else {
                    moveSlider(0, true);
                }

                afterTouchEnd();
            }

            /**
             * Handle touchcancel event
             */
            function onTouchCancel () {

                moveSlider(0, true);
                afterTouchEnd();
            }

            /**
             * Remove touch event listeners and remove className 'is-hiding'
             */
            function afterTouchEnd () {

                var touchContainer = findElement('.jw-card-slider-align')[0];

                startCoords = null;

                touchContainer.removeEventListener('touchmove', onTouchMove);
                touchContainer.removeEventListener('touchend', onTouchEnd);
                touchContainer.removeEventListener('touchcancel', onTouchCancel);

                userIsSliding = false;

                element.removeClass('is-sliding');
            }

            /**
             * Get coords object from native touch event. Original code from ngTouch.
             *
             * @param {Event} event
             * @returns {{x: (number), y: (number)}}
             */
            function getCoords (event) {

                var originalEvent = event.originalEvent || event,
                    touches       = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches
                        : [originalEvent],
                    e             = (originalEvent.changedTouches && originalEvent.changedTouches[0]) || touches[0];

                return {
                    x: e.clientX,
                    y: e.clientY
                };
            }

            /**
             * Ease out the given distance
             *
             * @param {number} current Current distance
             * @param {number} total Total distance
             * @returns {number}
             */
            function easeOutDistance (current, total) {

                return Math.sin((0.5 / total) * current) * current;
            }
        }
    }

}());
