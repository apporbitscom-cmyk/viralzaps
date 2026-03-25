// Apply saved theme on dashboard load (matches index.html)
(function () {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
        document.documentElement.setAttribute('data-theme', saved);
    }
})();

// Auth: redirect if not logged in; Sign out (sidebar only)
(function () {
    function goToHome() {
        window.location.replace('index.html');
    }

    if (typeof onAuthStateChanged === 'function') {
        onAuthStateChanged(function (user) {
            if (!user) {
                goToHome();
                return;
            }
        });
    } else if (typeof getAuthUnsupportedReason === 'function' && getAuthUnsupportedReason()) {
        goToHome();
    }

    function doLogout() {
        if (typeof signOut === 'function') {
            signOut().then(goToHome).catch(goToHome);
        } else {
            goToHome();
        }
    }

    document.getElementById('sidebar-logout')?.addEventListener('click', doLogout);
})();

(function () {
    var mq = typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 768px)') : null;
    var toggle = document.getElementById('dashboard-menu-toggle');
    var sidebar = document.getElementById('dashboard-sidebar');
    var backdrop = document.getElementById('dashboard-sidebar-backdrop');
    if (!toggle || !sidebar || !backdrop) return;

    function setNavOpen(open) {
        sidebar.classList.toggle('is-open', open);
        backdrop.classList.toggle('is-visible', open);
        backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
        document.body.classList.toggle('dashboard-nav-open', open);
        document.body.style.overflow = open ? 'hidden' : '';
    }

    function closeNav() {
        setNavOpen(false);
    }

    toggle.addEventListener('click', function () {
        setNavOpen(!sidebar.classList.contains('is-open'));
    });

    backdrop.addEventListener('click', closeNav);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeNav();
    });

    sidebar.addEventListener('click', function (e) {
        var t = e.target;
        if (window.innerWidth > 768) return;
        if (t.closest('.sidebar-link') || t.closest('.sidebar-sublink')) {
            closeNav();
            return;
        }
        if (t.closest('#sidebar-logout')) closeNav();
    });

    if (mq && typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', function (e) {
            if (!e.matches) closeNav();
        });
    } else if (mq && mq.addListener) {
        mq.addListener(function (e) {
            if (!e.matches) closeNav();
        });
    }

    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) closeNav();
    });
})();

(function () {
    // Copy legacy localStorage keys viralzap_* → viralzaps_* (one-time per key)
    (function migrateLegacyViralzapKeys() {
        var pairs = [
            ['viralzap_trial_start', 'viralzaps_trial_start'],
            ['viralzap_billing_history', 'viralzaps_billing_history'],
            ['viralzap_credits_purchased', 'viralzaps_credits_purchased'],
            ['viralzap_credits_used', 'viralzaps_credits_used'],
            ['viralzap_recent_searches', 'viralzaps_recent_searches']
        ];
        try {
            pairs.forEach(function (pr) {
                var oldK = pr[0];
                var newK = pr[1];
                if (!localStorage.getItem(newK) && localStorage.getItem(oldK)) {
                    localStorage.setItem(newK, localStorage.getItem(oldK));
                    localStorage.removeItem(oldK);
                }
            });
        } catch (e) {}
    })();

    var channelsBtn = document.getElementById('channels-btn');
    var channelsDropdown = document.getElementById('channels-dropdown');
    var channelsItem = document.querySelector('.sidebar-item-dropdown');
    var searchInput = document.getElementById('sidebar-search');
    var navList = document.getElementById('sidebar-nav-list');

    if (channelsBtn && channelsDropdown) {
        channelsBtn.addEventListener('click', function () {
            var isOpen = channelsDropdown.hasAttribute('hidden');
            channelsDropdown.toggleAttribute('hidden', !isOpen);
            channelsBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            channelsItem.classList.toggle('open', isOpen);
        });
    }

    // Sub-links: Shorts, Longform (prevent default, set active, update content placeholder)
    document.querySelectorAll('.sidebar-sublink').forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            setActiveNav(link, 'sublink');
            showPlaceholder(link.getAttribute('data-sub') || link.textContent.trim());
        });
    });

    // Nav links: Viral Videos, Similar Channels, Settings
    document.querySelectorAll('.sidebar-link').forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            setActiveNav(link, 'link');
            showPlaceholder(link.getAttribute('data-page') || link.textContent.trim());
        });
    });

    function setActiveNav(activeEl, type) {
        document.querySelectorAll('.sidebar-btn, .sidebar-link, .sidebar-sublink').forEach(function (el) {
            el.classList.remove('active');
        });
        if (activeEl) activeEl.classList.add('active');
    }

    // Quick filter & Sorted by options for Shorts and Longform
    var quickFilterOptions = [
        'Default',
        'Trending Channels',
        'High Views, Low Uploads',
        'Underrated Channels',
        'Recently Added To Viralzaps',
        'Picked by Viralzaps'
    ];
    var sortedByOptions = [
        'Subscriber Count',
        'Average Views',
        'Days Active',
        'Total Videos',
        'Recently Added',
        'Realtime Metrics',
        'Views (24h)',
        'Subs (24h)',
        'Views (48h)'
    ];
    var filterIconSvg = '<svg class="filter-dropdown-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>';
    var sortIconSvg = '<svg class="sort-dropdown-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/></svg>';
    var optionIconSvg = '<svg class="filter-option-icon" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
    var chevronDownSvg = '<svg class="filter-chevron" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>';

    function buildOptionRow(iconSvg, text) {
        return '<span class="filter-dropdown-option-inner">' + iconSvg + '<span class="filter-dropdown-option-text">' + escapeHtml(text) + '</span></span>';
    }

    var lastChannelList = [];
    var lastResultsEl = null;
    var lastVideoList = [];   // { item, channelId, viewCount, publishedAt } for Sorted by on video results
    var lastVideoResultsType = ''; // 'shorts' | 'longform'

    function getSortedByValue(view) {
        if (!view) return '';
        var trigger = view.querySelector('#shorts-sorted-by, #longform-sorted-by');
        if (!trigger) return '';
        var text = trigger.querySelector('.filter-dropdown-trigger-text');
        return text ? text.textContent.trim() : '';
    }

    function sortChannelsBy(channels, sortByValue) {
        var list = channels.slice();
        var key = (sortByValue || '').toLowerCase();
        if (key.indexOf('subscriber') !== -1) {
            list.sort(function (a, b) { return (b.channel.subscriberCount || 0) - (a.channel.subscriberCount || 0); });
        } else if (key.indexOf('average') !== -1 || key.indexOf('avg') !== -1) {
            list.sort(function (a, b) { return (b.channel.avgViews || 0) - (a.channel.avgViews || 0); });
        } else if (key.indexOf('days active') !== -1) {
            list.sort(function (a, b) {
                var atA = a.channel.publishedAt || '';
                var atB = b.channel.publishedAt || '';
                if (!atA && !atB) return 0;
                if (!atA) return 1;
                if (!atB) return -1;
                return atB.localeCompare(atA);
            });
        } else if (key.indexOf('total videos') !== -1) {
            list.sort(function (a, b) { return (b.channel.videoCount || 0) - (a.channel.videoCount || 0); });
        } else if (key.indexOf('recently added') !== -1) {
            list.sort(function (a, b) {
                var atA = a.channel.latestVideoAt || '';
                var atB = b.channel.latestVideoAt || '';
                return atB.localeCompare(atA);
            });
        } else if (key.indexOf('realtime') !== -1 || key.indexOf('24h') !== -1 || key.indexOf('48h') !== -1 || key.indexOf('subs (24h)') !== -1) {
            list.sort(function (a, b) { return (b.channel.viewCount || 0) - (a.channel.viewCount || 0); });
        } else {
            list.sort(function (a, b) { return (b.channel.viewCount || 0) - (a.channel.viewCount || 0); });
        }
        return list;
    }

    function buildChannelCardsHTML(channels) {
        var saveIconSvg = '<svg class="trending-channel-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>';
        var dotsIconSvg = '<svg class="trending-channel-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';
        var html = '<div class="trending-channels-list">';
        channels.forEach(function (item) {
            var ch = item.channel;
            var title = escapeHtml(ch.title);
            var recent = ch.recentVideos || [];
            var subs = formatCount(ch.subscriberCount) + ' sub';
            var avg = formatCountDecimal(ch.avgViews) + ' AVG';
            var total = formatCountDecimal(ch.viewCount) + ' TOTAL';
            var started = startedAgo(ch.publishedAt);
            html += '<article class="trending-channel-card">' +
                '<header class="trending-channel-header">' +
                '<div class="trending-channel-header-top">' +
                '<a href="https://www.youtube.com/channel/' + escapeHtml(ch.id) + '" target="_blank" rel="noopener noreferrer" class="trending-channel-identity">' +
                '<img class="trending-channel-avatar" src="' + escapeHtml(ch.thumb) + '" alt="" width="48" height="48">' +
                '<div class="trending-channel-identity-text">' +
                '<h3 class="trending-channel-name">' + title + '</h3>' +
                '<p class="trending-channel-meta">' + escapeHtml(subs) + '<span class="trending-channel-dot"> • </span><span class="trending-channel-lang">English</span></p>' +
                '</div></a>' +
                '<div class="trending-channel-right">' +
                '<p class="trending-channel-stats-right">' + escapeHtml(avg) + '<span class="trending-channel-dot"> • </span>' + escapeHtml(total) + '<span class="trending-channel-dot"> • </span>' + ch.videoCount + ' videos<span class="trending-channel-dot"> • </span>' + escapeHtml(started) + '</p>' +
                '<div class="trending-channel-actions">' +
                '<button type="button" class="trending-channel-btn-icon" aria-label="Save channel" title="Save">' + saveIconSvg + '</button>' +
                '<button type="button" class="trending-channel-btn-icon" aria-label="More options" title="More">' + dotsIconSvg + '</button>' +
                '</div></div></div>' +
                '<div class="trending-channel-realtime-row">' +
                '<span class="trending-channel-realtime-label">Realtime Views</span>' +
                '<span class="trending-channel-realtime-values">' +
                '24h: + ' + formatCountDecimal(Math.round(ch.viewCount * 0.0004)) +
                '<span class="trending-channel-realtime-sep">48h: + ' + formatCountDecimal(Math.round(ch.viewCount * 0.0007)) + '</span>' +
                '</span></div></header>' +
                '<div class="trending-channel-recent">' +
                '<p class="trending-channel-recent-title">Recent Videos (' + recent.length + ')</p>' +
                '<ul class="trending-channel-video-list">';
            recent.forEach(function (v) {
                var vTitle = v.title || 'Untitled';
                var vTitleShort = vTitle.length > 45 ? vTitle.substring(0, 42) + '...' : vTitle;
                var vViews = formatCount(v.viewCount) + ' views';
                var thumbUrl = v.id ? 'https://img.youtube.com/vi/' + escapeHtml(v.id) + '/mqdefault.jpg' : '';
                html += '<li class="trending-channel-video-item">' +
                    '<a href="https://www.youtube.com/watch?v=' + escapeHtml(v.id) + '" target="_blank" rel="noopener noreferrer" class="trending-channel-video-link">' +
                    (thumbUrl ? '<span class="trending-channel-video-thumb-wrap"><img class="trending-channel-video-thumb" src="' + thumbUrl + '" alt="" loading="lazy"></span>' : '') +
                    '<span class="trending-channel-video-info">' +
                    '<span class="trending-channel-video-title">' + escapeHtml(vTitleShort) + '</span>' +
                    '<span class="trending-channel-video-views">' + escapeHtml(vViews) + '</span>' +
                    '</span></a></li>';
            });
            html += '</ul></div></article>';
        });
        html += '</div>';
        return html;
    }

    function renderChannelCards(resultsEl, channels) {
        if (!resultsEl || !channels || !channels.length) return;
        lastChannelList = channels.slice();
        lastVideoList = [];
        lastVideoResultsType = '';
        lastResultsEl = resultsEl;
        resultsEl.innerHTML = buildChannelCardsHTML(channels);
    }

    function sortVideoListBy(videoList, sortBy, channelStatsMap) {
        var list = videoList.slice();
        var key = (sortBy || '').toLowerCase();
        list.sort(function (a, b) {
            var chA = channelStatsMap[a.channelId] || {};
            var chB = channelStatsMap[b.channelId] || {};
            if (key.indexOf('subscriber') !== -1) {
                return (chB.subscriberCount || 0) - (chA.subscriberCount || 0);
            }
            if (key.indexOf('average') !== -1 || key.indexOf('avg') !== -1) {
                return (b.viewCount || 0) - (a.viewCount || 0);
            }
            if (key.indexOf('days active') !== -1) {
                var atA = chA.publishedAt || '';
                var atB = chB.publishedAt || '';
                if (!atA && !atB) return 0;
                if (!atA) return 1;
                if (!atB) return -1;
                return atB.localeCompare(atA);
            }
            if (key.indexOf('total videos') !== -1) {
                return (chB.videoCount || 0) - (chA.videoCount || 0);
            }
            if (key.indexOf('recently added') !== -1) {
                var pA = a.publishedAt || '';
                var pB = b.publishedAt || '';
                return (pB || '').localeCompare(pA || '');
            }
            if (key.indexOf('realtime') !== -1 || key.indexOf('24h') !== -1 || key.indexOf('48h') !== -1 || key.indexOf('subs (24h)') !== -1) {
                return (b.viewCount || 0) - (a.viewCount || 0);
            }
            return (b.viewCount || 0) - (a.viewCount || 0);
        });
        return list;
    }

    function renderVideoListToResults(videoList, resultsEl, type) {
        if (!resultsEl || !videoList || !videoList.length) return;
        var isShorts = type === 'shorts';
        var gridClass = isShorts ? 'shorts-grid' : 'longform-grid';
        var cardClass = isShorts ? 'shorts-card' : 'longform-card';
        var bodyClass = isShorts ? 'shorts-card-body' : 'longform-card-body';
        var titleClass = isShorts ? 'shorts-card-title' : 'longform-card-title';
        var channelClass = isShorts ? 'shorts-card-channel' : 'longform-card-channel';
        var viewsClass = isShorts ? 'shorts-card-views' : 'longform-card-views';
        var thumbClass = isShorts ? 'shorts-card-thumb' : 'longform-card-thumb';
        var html = '<div class="' + gridClass + '">';
        videoList.forEach(function (entry) {
            var item = entry.item;
            var id = item.id && item.id.videoId ? item.id.videoId : '';
            var snip = item.snippet || {};
            var title = snip.title || 'Untitled';
            var channel = snip.channelTitle || '';
            var thumb = (snip.thumbnails && snip.thumbnails.medium) ? snip.thumbnails.medium.url : (snip.thumbnails && snip.thumbnails.default ? snip.thumbnails.default.url : '');
            var link = id ? 'https://www.youtube.com/watch?v=' + id : '#';
            var viewsStr = entry.viewCount !== undefined && entry.viewCount > 0 ? formatCount(entry.viewCount) + ' views' : '';
            html += '<a class="' + cardClass + '" href="' + link + '" target="_blank" rel="noopener noreferrer">' +
                '<div class="' + thumbClass + '"><img src="' + escapeHtml(thumb) + '" alt="" loading="lazy"></div>' +
                '<div class="' + bodyClass + '">' +
                '<h3 class="' + titleClass + '">' + escapeHtml(title) + '</h3>' +
                '<p class="' + channelClass + '">' + escapeHtml(channel) + '</p>' +
                (viewsStr ? '<p class="' + viewsClass + '">' + escapeHtml(viewsStr) + '</p>' : '') +
                '</div></a>';
        });
        html += '</div>';
        resultsEl.innerHTML = html;
    }

    function applySortedByToCurrentView() {
        if (!lastResultsEl) return;
        var view = lastResultsEl.closest('.shorts-view') || lastResultsEl.closest('.longform-view');
        var sortBy = getSortedByValue(view);

        if (lastChannelList.length > 0) {
            var sorted = sortChannelsBy(lastChannelList, sortBy);
            lastChannelList = sorted;
            lastResultsEl.innerHTML = buildChannelCardsHTML(sorted);
            return;
        }

        if (lastVideoList.length > 0) {
            var channelIds = [];
            lastVideoList.forEach(function (entry) {
                if (entry.channelId && channelIds.indexOf(entry.channelId) === -1) channelIds.push(entry.channelId);
            });
            lastResultsEl.innerHTML = '<p class="' + (lastVideoResultsType === 'shorts' ? 'shorts-message shorts-loading' : 'longform-message longform-loading') + '">Applying sort...</p>';
            fetchChannelStatistics(channelIds).then(function (channelStatsMap) {
                var sorted = sortVideoListBy(lastVideoList, sortBy, channelStatsMap);
                lastVideoList = sorted;
                renderVideoListToResults(sorted, lastResultsEl, lastVideoResultsType);
            }).catch(function () {
                renderVideoListToResults(lastVideoList, lastResultsEl, lastVideoResultsType);
            });
        }
    }

    function buildFilterDropdowns(quickId, sortId) {
        var qOpts = quickFilterOptions.map(function (o) {
            return '<button type="button" class="filter-dropdown-option" role="option" data-value="' + escapeHtml(o) + '">' + buildOptionRow(optionIconSvg, o) + '</button>';
        }).join('');
        var sOpts = sortedByOptions.map(function (o) {
            return '<button type="button" class="filter-dropdown-option" role="option" data-value="' + escapeHtml(o) + '">' + buildOptionRow(optionIconSvg, o) + '</button>';
        }).join('');
        return '<div class="filter-dropdowns-row">' +
            '<div class="filter-dropdown-group">' +
            '<label class="filter-dropdown-label">' + filterIconSvg + '<span>Quick filter</span></label>' +
            '<div class="filter-dropdown-wrap" id="' + quickId + '-wrap">' +
            '<button type="button" class="filter-dropdown-trigger" id="' + quickId + '" aria-haspopup="listbox" aria-expanded="false" aria-label="Quick filter">' +
            '<span class="filter-dropdown-trigger-inner">' + optionIconSvg + '<span class="filter-dropdown-trigger-text">' + escapeHtml(quickFilterOptions[0]) + '</span></span>' + chevronDownSvg + '</button>' +
            '<div class="filter-dropdown-list" role="listbox" id="' + quickId + '-list" hidden>' + qOpts + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="filter-dropdown-group">' +
            '<label class="filter-dropdown-label">' + sortIconSvg + '<span>Sorted by</span></label>' +
            '<div class="filter-dropdown-wrap" id="' + sortId + '-wrap">' +
            '<button type="button" class="filter-dropdown-trigger" id="' + sortId + '" aria-haspopup="listbox" aria-expanded="false" aria-label="Sorted by">' +
            '<span class="filter-dropdown-trigger-inner">' + optionIconSvg + '<span class="filter-dropdown-trigger-text">' + escapeHtml(sortedByOptions[0]) + '</span></span>' + chevronDownSvg + '</button>' +
            '<div class="filter-dropdown-list" role="listbox" id="' + sortId + '-list" hidden>' + sOpts + '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
    }

    function initFilterDropdowns(container) {
        if (!container) return;
        container.querySelectorAll('.filter-dropdown-wrap').forEach(function (wrap) {
            var trigger = wrap.querySelector('.filter-dropdown-trigger');
            var list = wrap.querySelector('.filter-dropdown-list');
            var options = wrap.querySelectorAll('.filter-dropdown-option');
            if (!trigger || !list) return;
            function open() {
                list.removeAttribute('hidden');
                trigger.setAttribute('aria-expanded', 'true');
            }
            function close() {
                list.setAttribute('hidden', '');
                trigger.setAttribute('aria-expanded', 'false');
            }
            function setValue(text) {
                var triggerText = trigger.querySelector('.filter-dropdown-trigger-text');
                if (triggerText) triggerText.textContent = text;
                close();
            }
            trigger.addEventListener('click', function (e) {
                e.stopPropagation();
                var isOpen = !list.hasAttribute('hidden');
                if (isOpen) close(); else open();
            });
            options.forEach(function (opt) {
                opt.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var val = this.getAttribute('data-value') || this.textContent.trim();
                    setValue(val);
                    var triggerId = trigger.id;
                    var isQuickFilter = triggerId === 'shorts-quick-filter' || triggerId === 'longform-quick-filter';
                    var isSortedBy = triggerId === 'shorts-sorted-by' || triggerId === 'longform-sorted-by';
                    if (isQuickFilter) {
                        var view = wrap.closest('.shorts-view') || wrap.closest('.longform-view');
                        var resultsEl = view ? view.querySelector('.shorts-results, .longform-results') : null;
                        if (resultsEl) {
                            if (val === 'Trending Channels') {
                                renderChannelsView(resultsEl, 'trending');
                            } else if (val === 'High Views, Low Uploads') {
                                renderChannelsView(resultsEl, 'highViewsLowUploads');
                            } else if (val === 'Underrated Channels') {
                                renderChannelsView(resultsEl, 'underratedChannels');
                            } else if (val === 'Recently Added To Viralzaps') {
                                renderChannelsView(resultsEl, 'recentlyAddedToViralzaps');
                            } else if (val === 'Picked by Viralzaps') {
                                lastChannelList = [];
                                lastResultsEl = null;
                                renderPickedByViralzapsView(resultsEl);
                            } else {
                                lastChannelList = [];
                                lastResultsEl = null;
                                if (view.classList.contains('shorts-view')) {
                                    searchYouTubeShorts('viral', resultsEl);
                                } else {
                                    searchYouTubeLongform('entertainment', resultsEl);
                                }
                            }
                        }
                    } else if (isSortedBy) {
                        applySortedByToCurrentView();
                    }
                });
            });
            document.addEventListener('click', function closeOnOutside(e) {
                if (!wrap.contains(e.target)) close();
            });
        });
    }

    function showPlaceholder(section) {
        var content = document.getElementById('dashboard-content');
        if (!content) return;
        var s = (section || '').toLowerCase().trim();
        if (s === 'home' || s === '') {
            showHomeView(content);
            return;
        }
        if (s === 'shorts') {
            showShortsView(content);
            return;
        }
        if (s === 'longform') {
            showLongformView(content);
            return;
        }
        if (s === 'viral') {
            showViralView(content);
            return;
        }
        if (s === 'similar') {
            showSimilarChannelsView(content);
            return;
        }
        if (s === 'settings') {
            showSettingsView(content);
            return;
        }
        if (s === 'trending topics' || s === 'trending-topics') {
            showTrendingTopicsView(content);
            return;
        }
        if (s === 'recommended ideas/topics' || s === 'recommended-ideas') {
            showRecommendedIdeasView(content);
            return;
        }
        if (s === 'youtube scraper' || s === 'youtube-scraper') {
            showYouTubeScraperView(content);
            return;
        }
        if (s === 'find channel' || s === 'find-channel') {
            showFindChannelView(content);
            return;
        }
        if (s === 'analytics') {
            showAnalyticsView(content);
            return;
        }
        var title = section || 'Content';
        content.innerHTML = '<p class="dashboard-welcome">' + title + ' — Content coming soon.</p>';
    }

    function showSectionPlaceholder(container, title, description) {
        container.innerHTML =
            '<div class="section-placeholder-view">' +
            '<h2 class="section-placeholder-title">' + escapeHtml(title) + '</h2>' +
            '<p class="section-placeholder-desc">' + escapeHtml(description) + '</p>' +
            '<p class="section-placeholder-note">This section is coming soon.</p>' +
            '</div>';
    }

    var VIRALZAPS_RECENT_KEY = 'viralzaps_recent_searches';
    var VIRALZAPS_RECENT_MAX = 30;

    function getViralzapsRecentSearches() {
        try {
            var raw = localStorage.getItem(VIRALZAPS_RECENT_KEY);
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr.slice(0, VIRALZAPS_RECENT_MAX) : [];
        } catch (e) {
            return [];
        }
    }

    function recordViralzapsSearch(query) {
        if (!query || typeof query !== 'string') return;
        var q = query.trim();
        if (q.length < 2) return;
        try {
            var list = getViralzapsRecentSearches();
            list = list.filter(function (x) { return x !== q; });
            list.unshift(q);
            list = list.slice(0, VIRALZAPS_RECENT_MAX);
            localStorage.setItem(VIRALZAPS_RECENT_KEY, JSON.stringify(list));
        } catch (e) {}
    }

    var TRENDING_TOPICS_LIST = [
        { name: 'AI and ChatGPT', keywords: 'ai chatgpt openai machine learning artificial intelligence' },
        { name: 'Cooking and Recipes', keywords: 'cooking recipes food chef kitchen baking' },
        { name: 'Fitness and Workout', keywords: 'fitness workout gym exercise health' },
        { name: 'Gaming', keywords: 'gaming gameplay streamer esports video games' },
        { name: 'Tech Reviews', keywords: 'tech review smartphone laptop gadget' },
        { name: 'Vlogs and Daily Life', keywords: 'vlog daily life lifestyle day in my life' },
        { name: 'Music and Covers', keywords: 'music cover song guitar piano singing' },
        { name: 'Comedy and Memes', keywords: 'comedy meme funny humor' },
        { name: 'Education and Tutorials', keywords: 'education tutorial how to learn' },
        { name: 'Beauty and Makeup', keywords: 'beauty makeup skincare tutorial' },
        { name: 'Travel', keywords: 'travel vlog vacation adventure travel vlog' },
        { name: 'Finance and Investing', keywords: 'finance investing money stocks crypto' },
        { name: 'Motivation and Self Improvement', keywords: 'motivation self improvement productivity success' },
        { name: 'True Crime', keywords: 'true crime documentary mystery' },
        { name: 'Reactions and Commentary', keywords: 'reaction commentary review' },
        { name: 'ASMR', keywords: 'asmr relaxing sleep' },
        { name: 'Unboxing and Hauls', keywords: 'unboxing haul review' },
        { name: 'DIY and Crafts', keywords: 'diy craft handmade tutorial' },
        { name: 'Animation and Cartoons', keywords: 'animation cartoon animated' },
        { name: 'Science and Space', keywords: 'science space nasa physics astronomy' },
        { name: 'History', keywords: 'history documentary historical' },
        { name: 'Sports Highlights', keywords: 'sports highlights football basketball soccer' },
        { name: 'Shorts and Viral Clips', keywords: 'shorts viral clip trending' },
        { name: 'Pranks and Challenges', keywords: 'prank challenge dare' },
        { name: 'Pets and Animals', keywords: 'pets dogs cats animals' },
        { name: 'Car and Automotive', keywords: 'cars automotive review racing' },
        { name: 'Fashion and Style', keywords: 'fashion style outfit ootd' },
        { name: 'Home and Interior', keywords: 'home interior design room tour' },
        { name: 'Parenting and Family', keywords: 'parenting family kids children' },
        { name: 'Relationship Advice', keywords: 'relationship dating advice' },
        { name: 'Meditation and Mindfulness', keywords: 'meditation mindfulness mental health' },
        { name: 'Language Learning', keywords: 'language learning english spanish' },
        { name: 'Coding and Programming', keywords: 'coding programming developer web dev' },
        { name: 'Photography', keywords: 'photography camera tips tutorial' },
        { name: 'Horror and Scary Stories', keywords: 'horror scary stories creepy' },
        { name: 'Conspiracy Theories', keywords: 'conspiracy theory mystery' },
        { name: 'Movie and TV Reviews', keywords: 'movie review tv show film' },
        { name: 'Book Summaries', keywords: 'book summary reading' },
        { name: 'Minimalism and Declutter', keywords: 'minimalism declutter organization' },
        { name: 'Sustainable Living', keywords: 'sustainable eco zero waste' },
        { name: 'Startup and Business', keywords: 'startup business entrepreneur' },
        { name: 'Real Estate', keywords: 'real estate house tour property' },
        { name: 'Crypto and Blockchain', keywords: 'crypto bitcoin ethereum blockchain' },
        { name: 'Podcast Highlights', keywords: 'podcast interview clip' },
        { name: 'Stand Up Comedy', keywords: 'stand up comedy standup' },
        { name: 'Dance and Choreography', keywords: 'dance choreography tiktok' },
        { name: 'Art and Drawing', keywords: 'art drawing sketch tutorial' },
        { name: 'Facts and Trivia', keywords: 'facts trivia did you know' },
        { name: 'Life Hacks', keywords: 'life hacks tips tricks' },
        { name: 'Productivity', keywords: 'productivity tips notetaking' },
        { name: 'Minimalist Cooking', keywords: 'minimalist cooking simple recipes' },
        { name: 'Street Food', keywords: 'street food food tour' },
        { name: 'Weight Loss Journey', keywords: 'weight loss transformation diet' },
        { name: 'Yoga', keywords: 'yoga stretch flexibility' },
        { name: 'Running and Marathon', keywords: 'running marathon fitness' },
        { name: 'Cycling', keywords: 'cycling bike travel' },
        { name: 'Fishing', keywords: 'fishing outdoor' },
        { name: 'Camping and Survival', keywords: 'camping survival outdoor' },
        { name: 'Garden and Plants', keywords: 'garden plants gardening' },
        { name: 'Cleaning and Organization', keywords: 'cleaning organization home' },
        { name: 'Tech News', keywords: 'tech news apple google' },
        { name: 'Gadget Unboxing', keywords: 'gadget unboxing tech' },
        { name: 'Robotics', keywords: 'robotics robot automation' },
        { name: 'Electric Vehicles', keywords: 'ev electric vehicle tesla' },
        { name: 'Celebrity News', keywords: 'celebrity news gossip' },
        { name: 'Reddit Stories', keywords: 'reddit stories aita' },
        { name: 'Scary True Stories', keywords: 'scary true stories horror' },
        { name: 'Mukbang', keywords: 'mukbang eating food' },
        { name: 'Satisfying Videos', keywords: 'satisfying oddly satisfying' },
        { name: 'Fail Compilations', keywords: 'fail funny compilation' },
        { name: 'Before and After', keywords: 'before and after transformation' },
        { name: 'Rags to Riches', keywords: 'rags to riches success story' },
        { name: 'Documentary Shorts', keywords: 'documentary short documentary' },
        { name: 'Philosophy', keywords: 'philosophy life meaning' },
        { name: 'Psychology', keywords: 'psychology mind behavior' },
        { name: 'Geography', keywords: 'geography countries world' },
        { name: 'Politics Explained', keywords: 'politics explained news' },
        { name: 'Law and Crime', keywords: 'law lawyer crime' },
        { name: 'Medical and Health', keywords: 'medical health doctor' },
        { name: 'Skincare Routine', keywords: 'skincare routine tutorial' },
        { name: 'Hair Tutorials', keywords: 'hair tutorial hairstyle' },
        { name: 'Nail Art', keywords: 'nail art nails' },
        { name: 'Thrift Flip', keywords: 'thrift flip diy fashion' },
        { name: 'Get Ready With Me', keywords: 'grwm get ready with me' },
        { name: 'Morning Routine', keywords: 'morning routine productivity' },
        { name: 'Night Routine', keywords: 'night routine sleep' },
        { name: 'Study With Me', keywords: 'study with me productivity' },
        { name: 'Work From Home', keywords: 'work from home remote' },
        { name: 'Side Hustle', keywords: 'side hustle passive income' },
        { name: 'Dropshipping', keywords: 'dropshipping ecommerce' },
        { name: 'Print on Demand', keywords: 'print on demand etsy' },
        { name: 'Affiliate Marketing', keywords: 'affiliate marketing' },
        { name: 'YouTube Growth', keywords: 'youtube growth monetization' },
        { name: 'Social Media Tips', keywords: 'social media tips instagram tiktok' },
        { name: 'Storytime', keywords: 'storytime story time' },
        { name: 'Rant', keywords: 'rant opinion' },
        { name: 'Hot Takes', keywords: 'hot take opinion' },
        { name: 'Debate', keywords: 'debate discussion' },
        { name: 'Interview', keywords: 'interview podcast' },
        { name: 'Behind The Scenes', keywords: 'bts behind the scenes' },
        { name: 'Q&A', keywords: 'q and a questions' },
        { name: 'Subscriber Special', keywords: 'subscriber milestone thank you' },
        { name: 'Collab', keywords: 'collab collaboration' },
        { name: 'Duet and Stitch', keywords: 'duet stitch tiktok' },
        { name: 'Trending Sounds', keywords: 'trending sound viral audio' },
        { name: 'Dance Challenge', keywords: 'dance challenge viral' },
        { name: 'Recipe Challenge', keywords: 'recipe challenge cooking' },
        { name: 'Budget Meals', keywords: 'budget meals cheap recipes' },
        { name: 'Meal Prep', keywords: 'meal prep weekly' },
        { name: 'Keto and Low Carb', keywords: 'keto low carb diet' },
        { name: 'Vegan and Vegetarian', keywords: 'vegan vegetarian plant based' },
        { name: 'Gluten Free', keywords: 'gluten free recipe' },
        { name: 'Desserts', keywords: 'dessert baking sweet' },
        { name: 'Coffee and Beverages', keywords: 'coffee beverage drink' },
        { name: 'Restaurant Review', keywords: 'restaurant review food' },
        { name: 'Fast Food', keywords: 'fast food review' },
        { name: 'Spicy Food', keywords: 'spicy food challenge' },
        { name: 'Baby and Toddler', keywords: 'baby toddler parenting' },
        { name: 'Teen Life', keywords: 'teen life high school' },
        { name: 'College Life', keywords: 'college university student' },
        { name: 'Career Advice', keywords: 'career advice job interview' },
        { name: 'Resume and LinkedIn', keywords: 'resume linkedin job' },
        { name: 'Freelancing', keywords: 'freelancing freelance' },
        { name: 'Digital Nomad', keywords: 'digital nomad travel work' },
        { name: 'Van Life', keywords: 'van life nomad' },
        { name: 'Tiny House', keywords: 'tiny house minimal' },
        { name: 'Renovation', keywords: 'renovation home diy' },
        { name: 'Moving Vlog', keywords: 'moving vlog new house' },
        { name: 'Car Review', keywords: 'car review automotive' },
        { name: 'Motorcycle', keywords: 'motorcycle bike' },
        { name: 'Sim Racing', keywords: 'sim racing gaming' },
        { name: 'Minecraft', keywords: 'minecraft gameplay' },
        { name: 'Roblox', keywords: 'roblox gameplay' },
        { name: 'Fortnite', keywords: 'fortnite gameplay' },
        { name: 'Mobile Games', keywords: 'mobile game gameplay' },
        { name: 'Horror Games', keywords: 'horror game gameplay' },
        { name: 'Speedrun', keywords: 'speedrun gaming' },
        { name: 'Game Review', keywords: 'game review' },
        { name: 'Anime', keywords: 'anime manga japan' },
        { name: 'K-Drama', keywords: 'k drama korean' },
        { name: 'Reality TV', keywords: 'reality tv show' },
        { name: 'Unfiltered Opinions', keywords: 'unfiltered opinion honest' },
        { name: 'Controversial Takes', keywords: 'controversial opinion' },
        { name: 'Self Care', keywords: 'self care routine' },
        { name: 'Anxiety and Depression', keywords: 'anxiety depression mental health' },
        { name: 'Therapy and Healing', keywords: 'therapy healing trauma' },
        { name: 'Spirituality', keywords: 'spirituality manifestation' },
        { name: 'Astrology', keywords: 'astrology zodiac' },
        { name: 'Tarot', keywords: 'tarot reading' },
        { name: 'True Crime Podcast', keywords: 'true crime podcast' },
        { name: 'Unsolved Mysteries', keywords: 'unsolved mystery' },
        { name: 'Paranormal', keywords: 'paranormal ghost' },
        { name: 'UFO and Aliens', keywords: 'ufo aliens' },
        { name: 'Conspiracy', keywords: 'conspiracy' },
        { name: 'Deep Dive', keywords: 'deep dive analysis' },
        { name: 'Explained', keywords: 'explained simple' },
        { name: 'Comparison', keywords: 'comparison vs' },
        { name: 'Top 10', keywords: 'top 10 list' },
        { name: 'Ranking', keywords: 'ranking list' },
        { name: 'Tier List', keywords: 'tier list' },
        { name: 'Roast', keywords: 'roast funny' },
        { name: 'Sarcasm', keywords: 'sarcasm satire' }
    ];

    function showTrendingTopicsView(container) {
        container.innerHTML =
            '<div class="trending-topics-view">' +
            '<h2 class="trending-topics-title">Trending Topics</h2>' +
            '<p class="trending-topics-subtitle">Enter a topic to see <strong>related videos</strong> that are popular on YouTube (high views, recent when available).</p>' +
            '<div class="trending-topics-search-wrap">' +
            '<input type="search" class="trending-topics-search-input" id="trending-topics-live-search" placeholder="Search a topic (e.g. gaming, recipes, tech)…" autocomplete="off">' +
            '<button type="button" class="trending-topics-search-btn" id="trending-topics-live-btn">Search</button>' +
            '</div>' +
            '<div class="trending-youtube-live-results" id="trending-youtube-live-results" aria-live="polite"></div>' +
            '</div>';

        var apiBaseUrl = (typeof window !== 'undefined' && window.VIRALZAPS_PUBLIC_CONFIG && window.VIRALZAPS_PUBLIC_CONFIG.apiBaseUrl)
            ? window.VIRALZAPS_PUBLIC_CONFIG.apiBaseUrl
            : 'http://localhost:4000';
        var inp = document.getElementById('trending-topics-live-search');
        var btn = document.getElementById('trending-topics-live-btn');
        var out = document.getElementById('trending-youtube-live-results');

        function renderLoading() {
            if (!out) return;
            out.innerHTML = '<p class="trending-topics-message trending-youtube-live-status">Loading…</p>';
        }

        function renderResults(items) {
            if (!out) return;
            if (!items || !items.length) {
                out.innerHTML = '<p class="trending-topics-message">No videos found. Try a broader topic.</p>';
                return;
            }
            var html = '<ul class="trending-youtube-live-list">';
            items.forEach(function (it) {
                var vid = escapeHtml(it.videoId || '');
                var title = escapeHtml(it.title || '');
                var ch = escapeHtml(it.channelTitle || '');
                var thumb = it.thumbnail ? escapeHtml(it.thumbnail) : '';
                html +=
                    '<li class="trending-youtube-live-item">' +
                    (thumb
                        ? '<a class="trending-youtube-live-thumb" href="https://www.youtube.com/watch?v=' +
                          vid +
                          '" target="_blank" rel="noopener noreferrer"><img src="' +
                          thumb +
                          '" alt="" loading="lazy" width="320" height="180"></a>'
                        : '') +
                    '<div class="trending-youtube-live-meta">' +
                    '<a class="trending-youtube-live-title" href="https://www.youtube.com/watch?v=' +
                    vid +
                    '" target="_blank" rel="noopener noreferrer">' +
                    title +
                    '</a>' +
                    '<span class="trending-youtube-live-channel">' +
                    ch +
                    '</span>' +
                    '</div></li>';
            });
            html += '</ul>';
            out.innerHTML = html;
        }

        function renderError(msg) {
            if (!out) return;
            out.innerHTML =
                '<p class="trending-topics-message trending-youtube-live-error">' + escapeHtml(msg || 'Something went wrong.') + '</p>';
        }

        function resolveActivePlanForQuota() {
            try {
                var raw = localStorage.getItem('subscription_plan');
                if (!raw) return 'plan_15d';
                var parsed = JSON.parse(raw);
                var p = parsed && parsed.plan ? String(parsed.plan).trim() : '';
                return p || 'plan_15d';
            } catch (e) {
                return 'plan_15d';
            }
        }

        function resolveActiveUserIdForQuota() {
            var u = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
            if (!u) return 'anonymous';
            if (u.uid) return String(u.uid).trim();
            if (u.email) return String(u.email).trim().toLowerCase();
            return 'anonymous';
        }

        function runSearch() {
            var q = inp ? inp.value.trim() : '';
            if (q.length < 2) {
                renderError('Enter at least 2 characters.');
                return;
            }
            renderLoading();
            recordViralzapsSearch(q);
            fetch(
                apiBaseUrl +
                    '/api/youtube-trending-topics-search?q=' +
                    encodeURIComponent(q) +
                    '&regionCode=IN&maxResults=24',
                {
                    headers: {
                        'X-User-Id': resolveActiveUserIdForQuota(),
                        'X-User-Plan': resolveActivePlanForQuota()
                    }
                }
            )
                .then(function (r) {
                    return r.json().then(function (j) {
                        return { ok: r.ok, json: j };
                    });
                })
                .then(function (data) {
                    if (!data.ok) {
                        var msg =
                            data.json && data.json.message
                                ? data.json.message
                                : data.json && data.json.error
                                  ? data.json.error
                                  : 'Request failed';
                        renderError(msg);
                        return;
                    }
                    var items = data.json && data.json.items ? data.json.items : [];
                    renderResults(items);
                })
                .catch(function () {
                    renderError('Could not reach the server. Start the backend and try again.');
                });
        }

        if (btn) btn.addEventListener('click', runSearch);
        if (inp) {
            inp.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    runSearch();
                }
            });
        }
    }

    function showRecommendedIdeasView(container) {
        var recent = getViralzapsRecentSearches();
        container.innerHTML =
            '<div class="recommended-ideas-view">' +
            '<h2 class="recommended-ideas-title">Recommended Ideas / Topics</h2>' +
            '<p class="recommended-ideas-subtitle">Based on your recent searches across Viralzaps. We match your interests to trending topic ideas.</p>' +
            (recent.length > 0 ? '<div class="recommended-ideas-recent"><p class="recommended-ideas-recent-label">Based on your searches</p><div class="recommended-ideas-tags" id="recommended-ideas-tags"></div></div>' : '') +
            '<div class="recommended-ideas-topics"><p class="recommended-ideas-topics-label">Recommended topic ideas</p><div class="recommended-ideas-list" id="recommended-ideas-list"></div></div>' +
            '</div>';
        var tagsEl = document.getElementById('recommended-ideas-tags');
        var listEl = document.getElementById('recommended-ideas-list');
        if (tagsEl && recent.length > 0) {
            recent.slice(0, 15).forEach(function (q) {
                var tag = document.createElement('span');
                tag.className = 'recommended-ideas-tag';
                tag.textContent = q;
                tagsEl.appendChild(tag);
            });
        }
        var words = [];
        recent.forEach(function (q) {
            var w = (q || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(function (x) { return x.length >= 2; });
            words.push.apply(words, w);
        });
        var seenWords = {};
        words.forEach(function (w) { seenWords[w] = true; });
        var matches = TRENDING_TOPICS_LIST.filter(function (t) {
            var kw = (t.keywords || '').toLowerCase().split(/\s+/);
            return kw.some(function (k) { return seenWords[k]; });
        });
        if (listEl) {
            if (matches.length === 0) {
                matches = TRENDING_TOPICS_LIST.slice(0, 30);
            }
            var uniq = [];
            var seen = {};
            matches.forEach(function (t) {
                if (!seen[t.name]) { seen[t.name] = true; uniq.push(t); }
            });
            uniq.slice(0, 40).forEach(function (t) {
                var li = document.createElement('div');
                li.className = 'recommended-ideas-item';
                li.textContent = t.name;
                listEl.appendChild(li);
            });
        }
    }

    function resolveChannelIdForAnalytics(raw) {
        if (!raw || typeof raw !== 'string') return Promise.resolve(null);
        var r = raw.trim();
        var channelIdMatch = r.match(/(?:youtube\.com\/channel\/|^)(UC[\w-]{22})/i);
        if (channelIdMatch) return Promise.resolve(channelIdMatch[1]);
        var handleMatch = r.match(/youtube\.com\/@([\w.-]+)/i);
        if (handleMatch) {
            var handle = handleMatch[1];
            if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
                return Promise.resolve(null);
            }
            var url = 'https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=' +
                encodeURIComponent(handle) + '&key=' + encodeURIComponent(YOUTUBE_API_KEY);
            return fetch(url).then(function (res) { return res.json(); }).then(function (data) {
                if (data.items && data.items[0] && data.items[0].id) return data.items[0].id;
                return null;
            }).catch(function () { return null; });
        }
        if (/^UC[\w-]{22}$/i.test(r)) return Promise.resolve(r);
        return Promise.resolve(null);
    }

    function showAnalyticsView(container) {
        container.innerHTML =
            '<div class="analytics-view">' +
            '<h2 class="analytics-title">Channel Analytics</h2>' +
            '<p class="analytics-subtitle">Paste any YouTube channel URL to see analytics and growth metrics with visual charts.</p>' +
            '<div class="analytics-search-wrap">' +
            '<input type="url" class="analytics-search-input" id="analytics-search-input" placeholder="Paste channel URL (e.g. https://www.youtube.com/channel/UC... or https://www.youtube.com/@handle)" autocomplete="off">' +
            '<button type="button" class="analytics-search-btn" id="analytics-search-btn">Load Analytics</button>' +
            '</div>' +
            '<div class="analytics-results" id="analytics-results"></div>' +
            '</div>';
        var resultsEl = document.getElementById('analytics-results');
        var inputEl = document.getElementById('analytics-search-input');
        var btnEl = document.getElementById('analytics-search-btn');

        function loadAnalytics() {
            var raw = (inputEl && inputEl.value) ? inputEl.value.trim() : '';
            if (!raw) {
                if (resultsEl) resultsEl.innerHTML = '<p class="analytics-message analytics-error">Enter a YouTube channel URL.</p>';
                return;
            }
            if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
                if (resultsEl) resultsEl.innerHTML = '<p class="analytics-message analytics-error">Could not load analytics. Refresh the page or try again.</p>';
                return;
            }
            if (resultsEl) resultsEl.innerHTML = '<p class="analytics-message analytics-loading">Loading channel and analytics...</p>';
            if (btnEl) btnEl.disabled = true;
            resolveChannelIdForAnalytics(raw)
                .then(function (channelId) {
                    if (!channelId) {
                        if (resultsEl) resultsEl.innerHTML = '<p class="analytics-message analytics-error">Could not identify channel. Use a full URL like https://www.youtube.com/channel/UC... or https://www.youtube.com/@handle</p>';
                        if (btnEl) btnEl.disabled = false;
                        return;
                    }
                    var chUrl = 'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=' +
                        encodeURIComponent(channelId) + '&key=' + encodeURIComponent(YOUTUBE_API_KEY);
                    return fetch(chUrl).then(function (r) { return r.json(); }).then(function (chData) {
                        var ch = chData.items && chData.items[0] ? chData.items[0] : null;
                        if (!ch) {
                            if (resultsEl) resultsEl.innerHTML = '<p class="analytics-message analytics-error">Channel not found.</p>';
                            if (btnEl) btnEl.disabled = false;
                            return;
                        }
                        var uploadsId = (ch.contentDetails && ch.contentDetails.relatedPlaylists && ch.contentDetails.relatedPlaylists.uploads) || '';
                        if (!uploadsId) {
                            renderAnalyticsResults(resultsEl, ch, []);
                            if (btnEl) btnEl.disabled = false;
                            return;
                        }
                        var plUrl = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=15&playlistId=' +
                            encodeURIComponent(uploadsId) + '&key=' + encodeURIComponent(YOUTUBE_API_KEY);
                        return fetch(plUrl).then(function (r) { return r.json(); }).then(function (plData) {
                            var videoIds = (plData.items || []).map(function (item) {
                                var vid = item.snippet && item.snippet.resourceId && item.snippet.resourceId.videoId;
                                return vid;
                            }).filter(Boolean);
                            if (videoIds.length === 0) {
                                renderAnalyticsResults(resultsEl, ch, []);
                                if (btnEl) btnEl.disabled = false;
                                return;
                            }
                            var vUrl = 'https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=' +
                                videoIds.join(',') + '&key=' + encodeURIComponent(YOUTUBE_API_KEY);
                            return fetch(vUrl).then(function (r) { return r.json(); }).then(function (vData) {
                                var videos = (vData.items || []).map(function (item) {
                                    var stat = item.statistics || {};
                                    var snip = item.snippet || {};
                                    return {
                                        id: item.id,
                                        title: (snip.title || '').substring(0, 50) + (snip.title && snip.title.length > 50 ? '…' : ''),
                                        viewCount: parseInt(stat.viewCount, 10) || 0,
                                        likeCount: parseInt(stat.likeCount, 10) || 0
                                    };
                                });
                                renderAnalyticsResults(resultsEl, ch, videos);
                                if (btnEl) btnEl.disabled = false;
                            });
                        }).catch(function () {
                            renderAnalyticsResults(resultsEl, ch, []);
                            if (btnEl) btnEl.disabled = false;
                        });
                    });
                })
                .catch(function () {
                    if (resultsEl) resultsEl.innerHTML = '<p class="analytics-message analytics-error">Failed to load. Check the URL and try again.</p>';
                    if (btnEl) btnEl.disabled = false;
                });
        }

        if (btnEl) btnEl.addEventListener('click', loadAnalytics);
        if (inputEl) inputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); loadAnalytics(); } });
    }

    function renderAnalyticsResults(resultsEl, ch, recentVideos) {
        if (!resultsEl) return;
        var snip = ch.snippet || {};
        var stat = ch.statistics || {};
        var subs = parseInt(stat.subscriberCount, 10) || 0;
        var totalViews = parseInt(stat.viewCount, 10) || 0;
        var videoCount = parseInt(stat.videoCount, 10) || 0;
        var title = snip.title || 'Channel';
        var thumb = (snip.thumbnails && snip.thumbnails.medium) ? snip.thumbnails.medium.url : (snip.thumbnails && snip.thumbnails.default ? snip.thumbnails.default.url : '');
        var channelId = ch.id || '';
        var channelUrl = channelId ? 'https://www.youtube.com/channel/' + channelId : '#';

        var html = '<div class="analytics-channel-card">' +
            '<a href="' + escapeHtml(channelUrl) + '" target="_blank" rel="noopener noreferrer" class="analytics-channel-identity">' +
            '<img class="analytics-channel-thumb" src="' + escapeHtml(thumb) + '" alt="" width="64" height="64">' +
            '<div class="analytics-channel-info">' +
            '<h3 class="analytics-channel-name">' + escapeHtml(title) + '</h3>' +
            '<p class="analytics-channel-meta">' + escapeHtml(formatCount(subs)) + ' subscribers · ' + escapeHtml(formatCount(videoCount)) + ' videos</p>' +
            '</div></a>' +
            '</div>';

        html += '<div class="analytics-metrics-row">' +
            '<div class="analytics-metric-box"><span class="analytics-metric-value">' + escapeHtml(formatCount(subs)) + '</span><span class="analytics-metric-label">Subscribers</span></div>' +
            '<div class="analytics-metric-box"><span class="analytics-metric-value">' + escapeHtml(formatCount(totalViews)) + '</span><span class="analytics-metric-label">Total Views</span></div>' +
            '<div class="analytics-metric-box"><span class="analytics-metric-value">' + escapeHtml(formatCount(videoCount)) + '</span><span class="analytics-metric-label">Videos</span></div>' +
            '<div class="analytics-metric-box"><span class="analytics-metric-value">' + (videoCount > 0 ? escapeHtml(formatCountDecimal(Math.round(totalViews / videoCount))) : '—') + '</span><span class="analytics-metric-label">Avg Views/Video</span></div>' +
            '</div>';

        if (recentVideos.length > 0) {
            var maxViews = Math.max.apply(null, recentVideos.map(function (v) { return v.viewCount; }).concat(1));
            html += '<div class="analytics-chart-section">' +
                '<h4 class="analytics-chart-title">Recent video performance (views)</h4>' +
                '<div class="analytics-chart-bars">';
            recentVideos.forEach(function (v) {
                var pct = maxViews > 0 ? Math.round((v.viewCount / maxViews) * 100) : 0;
                html += '<div class="analytics-chart-row">' +
                    '<span class="analytics-chart-label" title="' + escapeHtml(v.title) + '">' + escapeHtml(v.title) + '</span>' +
                    '<div class="analytics-chart-bar-wrap">' +
                    '<div class="analytics-chart-bar" style="width:' + pct + '%"></div>' +
                    '<span class="analytics-chart-value">' + escapeHtml(formatCount(v.viewCount)) + '</span>' +
                    '</div></div>';
            });
            html += '</div></div>';
        }

        resultsEl.innerHTML = html;
    }

    function showFindChannelView(container) {
        container.innerHTML =
            '<div class="find-channel-view">' +
            '  <h2 class="find-channel-title">Find Your Shorts Channel</h2>' +
            '  <p class="find-channel-subtitle">Upload any YouTube Studio screenshot from a <strong>Shorts channel</strong>. We\'ll identify it using our proprietary AI matching system.</p>' +
            '  <div class="find-channel-badge">SHORTS CHANNELS ONLY</div>' +
            '  <div class="find-channel-panels">' +
            '    <div class="find-channel-left">' +
            '      <span>Real Time Analysis</span>' +
            // '      <h3 class="find-channel-panel-title"><span class="find-channel-panel-icon">⚡</span> Real-Time Analysis</h3>' +
            // '      <p class="find-channel-panel-desc">Exclusively supported: Real-time analytics screenshots showing your current Subscriber count and view velocity. Choose which period your screenshot shows:</p>' +
            // '      <div class="find-channel-time-btns" role="group" aria-label="Time range for realtime analytics">' +
            // '        <button type="button" class="find-channel-time-btn" id="find-channel-24h" aria-pressed="false">🕐 Last 24 hours</button>' +
            // '        <button type="button" class="find-channel-time-btn active" id="find-channel-48h" aria-pressed="true">🕐 Last 48 hours</button>' +
            // '      </div>' +
            // '      <label class="find-channel-check-wrap"><input type="checkbox" class="find-channel-check" id="find-channel-date-check"> <span>📅 Specify Screenshot Date</span></label>' +
            '    </div>' +
            '    <div class="find-channel-right">' +
            '      <h3 class="find-channel-upload-title">Upload Realtime Analytics</h3>' +
            '      <p class="find-channel-upload-desc">Please upload a screenshot of your YouTube Studio Realtime section. This is the only supported format.</p>' +
            '      <div class="find-channel-upload-zone" id="find-channel-upload-zone">' +
            '        <span class="find-channel-upload-icon">☁️</span>' +
            '        <p class="find-channel-upload-hint">Drag &amp; drop or click to choose</p>' +
            '        <input type="file" class="find-channel-file-input" id="find-channel-file-input" accept="image/*" hidden>' +
            '      </div>' +
            '      <div class="find-channel-example">' +
            '        <span class="find-channel-example-badge">✔ SUPPORTED FORMAT</span>' +
            '        <div class="find-channel-example-box">' +
            '          <p class="find-channel-example-line">1,722 Subscribers <small>See live count</small></p>' +
            '          <p class="find-channel-example-line">2,377,289 Views - Last 48 hours</p>' +
            '          <p class="find-channel-example-chart">[Bar chart: 48h → Now]</p>' +
            '        </div>' +
            '      </div>' +
            '      <p class="find-channel-must">Must show Subscribers and Views (Last 48 hours) as shown above.</p>' +
            '      <button type="button" class="find-channel-choose-btn" id="find-channel-choose-btn">📷 Choose Screenshot</button>' +
            '      <button type="button" class="find-channel-find-btn" id="find-channel-find-btn" style="display:none;">Find Channel</button>' +
            '      <div class="find-channel-result" id="find-channel-result"></div>' +
            '    </div>' +
            '  </div>' +
            '</div>';
        var uploadZone = document.getElementById('find-channel-upload-zone');
        var fileInput = document.getElementById('find-channel-file-input');
        var chooseBtn = document.getElementById('find-channel-choose-btn');
        var findBtn = document.getElementById('find-channel-find-btn');
        var resultEl = document.getElementById('find-channel-result');
        var lastUploadedDataUrl = null;

        function handleFile(file) {
            if (!file || !file.type.match(/^image\//)) {
                if (resultEl) resultEl.innerHTML = '<p class="find-channel-result-msg find-channel-result-err">Please choose an image file (PNG, JPG, etc.).</p>';
                if (findBtn) findBtn.style.display = 'none';
                lastUploadedDataUrl = null;
                return;
            }
            if (resultEl) resultEl.innerHTML = '<p class="find-channel-result-msg find-channel-loading">Uploading...</p>';
            var reader = new FileReader();
            reader.onload = function (e) {
                var dataUrl = e.target.result;
                lastUploadedDataUrl = dataUrl;
                if (uploadZone) {
                    uploadZone.classList.add('has-image');
                    var prev = uploadZone.querySelector('.find-channel-preview');
                    if (prev) prev.remove();
                    var img = document.createElement('img');
                    img.src = dataUrl;
                    img.alt = 'Screenshot';
                    img.className = 'find-channel-preview';
                    uploadZone.appendChild(img);
                }
                if (findBtn) findBtn.style.display = 'inline-flex';
                if (resultEl) resultEl.innerHTML = '<p class="find-channel-result-msg find-channel-ok">Screenshot ready. Click <strong>Find Channel</strong> to search.</p>';
            };
            reader.readAsDataURL(file);
        }

        var FIND_CHANNEL_BLOCKLIST_IDS = ['UCBR8-60-B28hp2BmDPdntcQ', 'UCOThWLpxFnqLtuUhcb3CakA', 'UCid_BCcs5oOUj9HKuEeKbuw'];

        function extractChannelCandidatesFromOcrText(text) {
            if (!text || !text.trim()) return [];
            var skip = /^(Subscribers?|Views?|See live count|Last \d+ hours?|Realtime|Now|\d[\d,.\s]*|YouTube|Studio|Analytics|Overview|SUPPORTED|FORMAT|Bar chart|48h|Google|Creators|Advertise|Developers|Terms|Privacy|Policy|Safety|Features|Sunday Ticket|The Q|search|The Q search|Live|Videos|Video|Home|Subscriptions?|Library|History|Watch later|Liked videos|Playlist|Latest|Popular|Oldest|Shorts|Posts|Subscribe|\.\.\.?more)$/i;
            var lines = text.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
            var candidates = [];
            var seen = {};
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.length < 2 || line.length > 60) continue;
                if (skip.test(line)) continue;
                if (/^YouTube\s+Studio$/i.test(line) || /^Studio\s+YouTube$/i.test(line)) continue;
                if (/^\d+([,.]\d+)*\s*$/.test(line)) continue;
                if (line.toLowerCase() === 'youtube' || line.toLowerCase() === 'studio') continue;
                if (/^(Latest|Popular|Oldest)(\s+(Latest|Popular|Oldest))*$/i.test(line)) continue;
                if (/^(The|A|An)\s+\w+$/i.test(line) && line.length < 12) continue;
                var handle = line.match(/@[\w.-]+/);
                if (handle) {
                    var h = handle[0].replace(/^@/, '');
                    if (!seen[h]) { seen[h] = true; candidates.push(h); }
                    continue;
                }
                if (/youtube\.com\/channel\/UC[\w-]{22}/i.test(line)) {
                    var id = line.match(/UC[\w-]{22}/i)[0];
                    if (FIND_CHANNEL_BLOCKLIST_IDS.indexOf(id) === -1 && !seen[id]) {
                        seen[id] = true;
                        candidates.unshift(id);
                    }
                    continue;
                }
                if (/youtube\.com\/@([\w.-]+)/i.test(line)) {
                    var handleName = line.match(/youtube\.com\/@([\w.-]+)/i)[1];
                    if (!seen[handleName]) { seen[handleName] = true; candidates.unshift(handleName); }
                    continue;
                }
                var key = line.toLowerCase().replace(/\s+/g, ' ');
                var norm = key.replace(/[^a-z0-9]+/g, '');
                if (norm.length < 3) continue;
                if (!seen[key]) {
                    seen[key] = true;
                    candidates.push(line);
                }
            }
            candidates.sort(function (a, b) { return (b.length || 0) - (a.length || 0); });
            return candidates;
        }

        function runFindChannel() {
            if (!lastUploadedDataUrl) {
                if (resultEl) resultEl.innerHTML = '<p class="find-channel-result-msg find-channel-result-err">Upload a screenshot first.</p>';
                return;
            }
            if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
                if (resultEl) resultEl.innerHTML = '<p class="find-channel-result-msg find-channel-result-err">Could not search channels. Refresh the page or try again.</p>';
                return;
            }
            if (resultEl) resultEl.innerHTML = '<p class="find-channel-result-msg find-channel-loading">Reading screenshot and searching for channel...</p>';
            if (findBtn) findBtn.disabled = true;
            var Tesseract = window.Tesseract;
            if (!Tesseract || !Tesseract.recognize) {
                if (resultEl) resultEl.innerHTML = '<p class="find-channel-result-msg find-channel-result-err">OCR not loaded. Refresh the page and try again.</p>';
                if (findBtn) findBtn.disabled = false;
                return;
            }
            Tesseract.recognize(lastUploadedDataUrl, 'eng', { logger: function () {} })
                .then(function (result) {
                    var text = (result && result.data && result.data.text) ? result.data.text : '';
                    var candidates = extractChannelCandidatesFromOcrText(text);
                    var ocrLower = (text || '').toLowerCase();
                    var ocrNorm = ocrLower.replace(/[^a-z0-9]+/g, '');

                    function titleAppearsInOcr(title) {
                        if (!title || title.length < 2) return false;
                        var titleLower = title.toLowerCase();
                        var normTitle = titleLower.replace(/[^a-z0-9]+/g, '');
                        return ocrLower.indexOf(titleLower) !== -1 || (normTitle.length >= 3 && ocrNorm.indexOf(normTitle) !== -1);
                    }

                    function searchWithQuery(query) {
                        var url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=15&key=' +
                            encodeURIComponent(YOUTUBE_API_KEY) + '&q=' + encodeURIComponent(query);
                        return fetch(url).then(function (r) { return r.json(); });
                    }

                    function fetchChannelByHandle(handle) {
                        var h = (handle || '').replace(/^@/, '').trim();
                        if (!h || /\s/.test(h)) return Promise.resolve(null);
                        var url = 'https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=' +
                            encodeURIComponent(h) + '&key=' + encodeURIComponent(YOUTUBE_API_KEY);
                        return fetch(url).then(function (r) { return r.json(); }).then(function (data) {
                            if (data.error || !(data.items && data.items.length)) return null;
                            var ch = data.items[0];
                            var id = ch.id || '';
                            if (FIND_CHANNEL_BLOCKLIST_IDS.indexOf(id) !== -1) return null;
                            return ch;
                        });
                    }

                    function isHandleLikeCandidate(query) {
                        var q = (query || '').trim().replace(/^@/, '');
                        return q.length >= 2 && q.length <= 30 && !/\s/.test(q) && /^[\w.-]+$/.test(q);
                    }

                    function tryNextCandidate(index) {
                        if (index >= candidates.length) {
                            var preview = text.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 8).join(' | ');
                            if (resultEl) resultEl.innerHTML = '<p class="find-channel-result-msg find-channel-result-err">No channel in the screenshot could be matched. We only return a channel if its name appears in the image. Text we read: &ldquo;' + escapeHtml(preview || '(none)') + '&rdquo;. Make sure the channel name (e.g. Fact Hunter) is clearly visible in the screenshot.</p>';
                            if (findBtn) findBtn.disabled = false;
                            return Promise.resolve();
                        }
                        var query = candidates[index];
                        function renderChannelResult(ch) {
                            var channelId = ch.id && ch.id.channelId ? ch.id.channelId : (ch.id || '');
                            var title = (ch.snippet && ch.snippet.title) ? ch.snippet.title : 'Channel';
                            var channelUrl = channelId ? 'https://www.youtube.com/channel/' + channelId : '';
                            var html = '<div class="find-channel-success">' +
                                '<p class="find-channel-result-msg find-channel-ok">Channel found (name matched from screenshot):</p>' +
                                '<a class="find-channel-link" href="' + escapeHtml(channelUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(channelUrl) + '</a>' +
                                '<p class="find-channel-channel-name">' + escapeHtml(title) + '</p>' +
                                '</div>';
                            if (resultEl) resultEl.innerHTML = html;
                            if (findBtn) findBtn.disabled = false;
                        }
                        if (isHandleLikeCandidate(query)) {
                            return fetchChannelByHandle(query).then(function (ch) {
                                if (ch && ch.snippet && ch.snippet.title && titleAppearsInOcr(ch.snippet.title)) {
                                    renderChannelResult(ch);
                                    return;
                                }
                                return tryWithSearch();
                            });
                        }
                        return tryWithSearch();

                        function tryWithSearch() {
                            return searchWithQuery(query).then(function (data) {
                                if (data.error) {
                                    return tryNextCandidate(index + 1);
                                }
                                var items = (data.items || []).filter(function (ch) {
                                    var id = ch.id && ch.id.channelId ? ch.id.channelId : '';
                                    return FIND_CHANNEL_BLOCKLIST_IDS.indexOf(id) === -1;
                                });
                                var normQuery = (query || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
                                if (normQuery.length < 3) return tryNextCandidate(index + 1);
                                var matching = [];
                                items.forEach(function (ch) {
                                    var title = (ch.snippet && ch.snippet.title) ? ch.snippet.title : '';
                                    var normTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '');
                                    var titleInOcr = titleAppearsInOcr(title);
                                    var titleMatchesQuery = normTitle.length >= 3 && (normTitle.indexOf(normQuery) !== -1 || normQuery.indexOf(normTitle) !== -1);
                                    if (titleInOcr && titleMatchesQuery) matching.push(ch);
                                });
                                if (matching.length > 0) {
                                    var best = matching[0];
                                    var bestScore = -1;
                                    matching.forEach(function (ch) {
                                        var title = (ch.snippet && ch.snippet.title) ? ch.snippet.title : '';
                                        var normTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '');
                                        var score = (normQuery === normTitle) ? 3 : (normTitle.indexOf(normQuery) !== -1 ? 2 : 1);
                                        if (score > bestScore) { bestScore = score; best = ch; }
                                    });
                                    renderChannelResult(best);
                                    return;
                                }
                                return tryNextCandidate(index + 1);
                            });
                        }
                    }

                    if (candidates.length === 0) {
                        var preview = text.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 6).join(' | ');
                        if (resultEl) resultEl.innerHTML = '<p class="find-channel-result-msg find-channel-result-err">Could not detect a channel name in the screenshot. Text we read: &ldquo;' + escapeHtml(preview || '(none)') + '&rdquo;. Ensure the channel name is visible (e.g. at the top of YouTube Studio).</p>';
                        if (findBtn) findBtn.disabled = false;
                        return Promise.resolve();
                    }
                    return tryNextCandidate(0);
                })
                .catch(function (err) {
                    if (resultEl) resultEl.innerHTML = '<p class="find-channel-result-msg find-channel-result-err">Could not read screenshot. Try a clearer image.</p>';
                    if (findBtn) findBtn.disabled = false;
                });
        }

        if (findBtn) findBtn.addEventListener('click', runFindChannel);

        if (chooseBtn && fileInput) {
            chooseBtn.addEventListener('click', function () { fileInput.click(); });
        }
        if (fileInput) {
            fileInput.addEventListener('change', function () {
                var f = this.files && this.files[0];
                if (f) handleFile(f);
            });
        }
        if (uploadZone && fileInput) {
            uploadZone.addEventListener('click', function () { fileInput.click(); });
            uploadZone.addEventListener('dragover', function (e) { e.preventDefault(); uploadZone.classList.add('drag-over'); });
            uploadZone.addEventListener('dragleave', function () { uploadZone.classList.remove('drag-over'); });
            uploadZone.addEventListener('drop', function (e) {
                e.preventDefault();
                uploadZone.classList.remove('drag-over');
                var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
                if (f) handleFile(f);
            });
        }
        var btn24 = document.getElementById('find-channel-24h');
        var btn48 = document.getElementById('find-channel-48h');
        if (btn24) {
            btn24.addEventListener('click', function () {
                this.classList.add('active');
                this.setAttribute('aria-pressed', 'true');
                if (btn48) { btn48.classList.remove('active'); btn48.setAttribute('aria-pressed', 'false'); }
            });
        }
        if (btn48) {
            btn48.addEventListener('click', function () {
                this.classList.add('active');
                this.setAttribute('aria-pressed', 'true');
                if (btn24) { btn24.classList.remove('active'); btn24.setAttribute('aria-pressed', 'false'); }
            });
        }
    }

    function showYouTubeScraperView(container) {
        container.innerHTML =
            '<div class="scraper-view">' +
            '  <div class="scraper-header">' +
            '    <span class="scraper-header-icon" aria-hidden="true">✨</span>' +
            '    <h1 class="scraper-title">YouTube Shorts &amp; Videos Scraper</h1>' +
            '    <p class="scraper-subtitle">Extract videos, transcripts, and analytics from any YouTube channel.</p>' +
            '  </div>' +
            '  <div class="scraper-panel">' +
            '    <div class="scraper-input-row">' +
            '      <input type="url" class="scraper-url-input" id="scraper-url-input" placeholder="Enter YouTube channel URL (e.g., https://www.youtube.com/@channelname)" autocomplete="off">' +
            '      <button type="button" class="scraper-submit-btn" id="scraper-submit-btn" title="Scrape" aria-label="Scrape">' +
            '        <svg class="scraper-arrow-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg>' +
            '      </button>' +
            '    </div>' +
            '    <div class="scraper-options-row">' +
            '      <div class="scraper-option-group">' +
            '        <label class="scraper-option-label"><span class="scraper-option-icon" aria-hidden="true">🎥</span> Video Type</label>' +
            '        <select class="scraper-option-select" id="scraper-video-type" aria-label="Video type">' +
            '          <option value="short">Shorts</option>' +
            '          <option value="longform">Longform</option>' +
            '          <option value="short_longform">Short &amp; longform</option>' +
            '        </select>' +
            '      </div>' +
            '      <div class="scraper-option-group">' +
            '        <label class="scraper-option-label"><span class="scraper-option-icon" aria-hidden="true">#</span> Max Videos</label>' +
            '        <select class="scraper-option-select" id="scraper-max-videos" aria-label="Max videos">' +
            '          <option value="5">5 videos</option>' +
            '          <option value="10" selected>10 videos</option>' +
            '          <option value="20">20 videos</option>' +
            '          <option value="50">50 videos</option>' +
            '          <option value="100">100 videos</option>' +
            '          <option value="custom">Custom max (100)</option>' +
            '        </select>' +
            '      </div>' +
            '      <div class="scraper-option-group">' +
            '        <label class="scraper-option-label"><span class="scraper-option-icon" aria-hidden="true">📄</span> Export Format</label>' +
            '        <select class="scraper-option-select" id="scraper-export-format" aria-label="Export format">' +
            '          <option value="json_only">JSON</option>' +
            '          <option value="csv_only">CSV</option>' +
            '          <option value="csv_and_json" selected>JSON &amp; CSV</option>' +
            '        </select>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '  <div class="scraper-results" id="scraper-results">' +
            '    <div class="scraper-empty-state" id="scraper-empty-state">' +
            '      <span class="scraper-empty-icon" aria-hidden="true">📷</span>' +
            '      <p class="scraper-empty-title">No videos scraped yet</p>' +
            '      <p class="scraper-empty-desc">Enter a YouTube channel URL above to get started</p>' +
            '    </div>' +
            '  </div>' +
            '</div>';
        var urlInput = document.getElementById('scraper-url-input');
        var submitBtn = document.getElementById('scraper-submit-btn');
        var videoTypeSelect = document.getElementById('scraper-video-type');
        var maxVideosSelect = document.getElementById('scraper-max-videos');
        var exportSelect = document.getElementById('scraper-export-format');
        var resultsEl = document.getElementById('scraper-results');
        var emptyState = document.getElementById('scraper-empty-state');

        if (submitBtn) {
            submitBtn.addEventListener('click', function () {
                var url = (urlInput && urlInput.value) ? urlInput.value.trim() : '';
                if (!url) return;
                var videoType = (videoTypeSelect && videoTypeSelect.value) ? videoTypeSelect.value : 'short_longform';
                var maxVideosVal = (maxVideosSelect && maxVideosSelect.value) ? maxVideosSelect.value : '10';
                var maxVideos = maxVideosVal === 'custom' ? 100 : Math.min(100, parseInt(maxVideosVal, 10) || 10);
                var format = (exportSelect && exportSelect.value) ? exportSelect.value : 'csv_and_json';
                runScraper(url, { format: format, videoType: videoType, maxVideos: maxVideos }, resultsEl, emptyState);
            });
        }
    }

    function parseYouTubeUrl(url) {
        var v = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
        if (v) return { type: 'video', id: v[1] };
        var c = url.match(/youtube\.com\/channel\/(UC[\w-]{22})/i);
        if (c) return { type: 'channel', id: c[1] };
        var h = url.match(/youtube\.com\/(?:c\/|@)([\w.-]+)/i);
        if (h) return { type: 'handle', id: h[1] };
        return null;
    }

    function parseIsoDuration(iso) {
        if (!iso || typeof iso !== 'string') return { seconds: 0, human: '0s' };
        var match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
        var h = parseInt(match && match[1], 10) || 0;
        var m = parseInt(match && match[2], 10) || 0;
        var s = parseInt(match && match[3], 10) || 0;
        var total = h * 3600 + m * 60 + s;
        var parts = [];
        if (h) parts.push(h + 'h');
        if (m) parts.push(m + 'm');
        parts.push(s + 's');
        return { seconds: total, human: parts.join(' ') };
    }

    function getVideoIdsFromInput(parsed, apiKey, maxVideos) {
        maxVideos = Math.min(100, Math.max(1, parseInt(maxVideos, 10) || 10));
        if (parsed.type === 'video') return Promise.resolve([parsed.id]);
        var channelId = parsed.id;
        if (parsed.type === 'handle') {
            var searchUrl = 'https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=' +
                encodeURIComponent('@' + parsed.id.replace(/^@/, '')) + '&key=' + encodeURIComponent(apiKey);
            return fetch(searchUrl).then(function (r) { return r.json(); }).then(function (data) {
                if (data.items && data.items[0]) channelId = data.items[0].id;
                if (channelId) return getUploadsPlaylistVideoIds(channelId, apiKey, maxVideos);
                return [];
            });
        }
        return getUploadsPlaylistVideoIds(channelId, apiKey, maxVideos);
    }

    function getUploadsPlaylistVideoIds(channelId, apiKey, maxVideos) {
        maxVideos = Math.min(100, Math.max(1, parseInt(maxVideos, 10) || 10));
        var url = 'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=' +
            encodeURIComponent(channelId) + '&key=' + encodeURIComponent(apiKey);
        return fetch(url).then(function (r) { return r.json(); }).then(function (data) {
            var uploadsId = data.items && data.items[0] && data.items[0].contentDetails && data.items[0].contentDetails.relatedPlaylists && data.items[0].contentDetails.relatedPlaylists.uploads;
            if (!uploadsId) return [];
            var ids = [];
            var pageToken = '';
            function fetchPage() {
                var plUrl = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=' +
                    encodeURIComponent(uploadsId) + '&key=' + encodeURIComponent(apiKey) + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
                return fetch(plUrl).then(function (r) { return r.json(); }).then(function (pl) {
                    (pl.items || []).forEach(function (item) {
                        var vid = item.snippet && item.snippet.resourceId && item.snippet.resourceId.videoId;
                        if (vid && ids.length < maxVideos) ids.push(vid);
                    });
                    pageToken = pl.nextPageToken || '';
                    if (ids.length >= maxVideos || !pageToken) return ids;
                    return fetchPage();
                });
            }
            return fetchPage();
        });
    }

    function fetchVideoDetailsForScraper(videoIds, apiKey) {
        if (!videoIds.length || !apiKey) return Promise.resolve([]);
        var url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=' +
            videoIds.join(',') + '&key=' + encodeURIComponent(apiKey);
        return fetch(url).then(function (r) { return r.json(); }).then(function (data) {
            var out = [];
            (data.items || []).forEach(function (item) {
                var snip = item.snippet || {};
                var stat = item.statistics || {};
                var content = item.contentDetails || {};
                var dur = parseIsoDuration(content.duration);
                var thumb = (snip.thumbnails && snip.thumbnails.maxres) ? snip.thumbnails.maxres.url : (snip.thumbnails && snip.thumbnails.high) ? snip.thumbnails.high.url : (snip.thumbnails && snip.thumbnails.medium) ? snip.thumbnails.medium.url : '';
                var channelId = snip.channelId || '';
                out.push({
                    category: String(snip.categoryId || ''),
                    channel: snip.channelTitle || '',
                    channel_id: channelId,
                    channel_url: channelId ? 'https://www.youtube.com/channel/' + channelId : '',
                    comment_count: parseInt(stat.commentCount, 10) || 0,
                    description: snip.description || '',
                    duration_human: dur.human,
                    duration_seconds: dur.seconds,
                    is_live: (content.liveBroadcastContent || '').toLowerCase() === 'live',
                    like_count: parseInt(stat.likeCount, 10) || 0,
                    publish_date: snip.publishedAt || '',
                    tags: Array.isArray(snip.tags) ? snip.tags.join(', ') : (snip.tags || ''),
                    thumbnail: thumb || ('https://i.ytimg.com/vi/' + item.id + '/hqdefault.jpg'),
                    title: snip.title || '',
                    transcript: '',
                    url: 'https://www.youtube.com/watch?v=' + item.id,
                    video_id: item.id,
                    view_count: parseInt(stat.viewCount, 10) || 0
                });
            });
            return out;
        });
    }

    function runScraper(url, options, resultsEl, emptyState) {
        if (!resultsEl) return;
        var format = (options && options.format) ? options.format : 'csv_and_json';
        var videoType = (options && options.videoType) ? options.videoType : 'short_longform';
        var maxVideos = (options && options.maxVideos) ? Math.min(100, Math.max(1, parseInt(options.maxVideos, 10) || 10)) : 10;
        if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
            if (emptyState) emptyState.style.display = 'none';
            resultsEl.innerHTML = '<p class="scraper-message scraper-error">Could not load this section. Refresh the page or try again.</p>';
            return;
        }
        var parsed = parseYouTubeUrl(url);
        if (!parsed) {
            if (emptyState) emptyState.style.display = 'none';
            resultsEl.innerHTML = '<p class="scraper-message scraper-error">Enter a valid YouTube video or channel URL.</p>';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';
        resultsEl.innerHTML = '<p class="scraper-message scraper-loading">Scraping...</p>';
        getVideoIdsFromInput(parsed, YOUTUBE_API_KEY, maxVideos)
            .then(function (ids) {
                if (!ids || ids.length === 0) {
                    resultsEl.innerHTML = '<p class="scraper-message scraper-error">No videos found.</p>';
                    return;
                }
                return fetchVideoDetailsForScraper(ids, YOUTUBE_API_KEY);
            })
            .then(function (videos) {
                if (!videos || videos.length === 0) {
                    resultsEl.innerHTML = '<p class="scraper-message scraper-error">Could not load video details.</p>';
                    return;
                }
                var filtered = videos;
                if (videoType === 'short') filtered = videos.filter(function (v) { return v.duration_seconds <= 60; });
                else if (videoType === 'longform') filtered = videos.filter(function (v) { return v.duration_seconds >= 20 * 60; });
                filtered = filtered.slice(0, maxVideos);
                renderScraperResults(resultsEl, filtered.length ? filtered : videos.slice(0, maxVideos));
            })
            .catch(function (err) {
                resultsEl.innerHTML = '<p class="scraper-message scraper-error">Network error. Try again.</p>';
            });
    }

    function renderScraperResults(resultsEl, videos) {
        var n = videos.length;
        var docIcon = '<span class="scraper-export-btn-icon">📄</span>';
        var countHtml = '<p class="scraper-count">' + n + ' video' + (n !== 1 ? 's' : '') + ' scraped</p>';
        var btnRow = '<div class="scraper-export-btns">' +
            '<button type="button" class="scraper-export-btn" id="scraper-export-transcripts">' + docIcon + 'Export Transcripts</button>' +
            '<button type="button" class="scraper-export-btn" id="scraper-export-csv">' + docIcon + 'Export CSV</button>' +
            '<button type="button" class="scraper-export-btn" id="scraper-export-json">' + docIcon + 'Export JSON</button>' +
            '</div>';
        var table = '<div class="scraper-table-wrap"><table class="scraper-table"><thead><tr>' +
            '<th>THUMBNAIL</th><th>TITLE</th><th>VIEWS</th><th>LIKES</th><th>DURATION</th><th>PUBLISHED</th><th>TRANSCRIPT</th>' +
            '</tr></thead><tbody>';
        videos.forEach(function (v) {
            var pubDate = v.publish_date ? new Date(v.publish_date).toLocaleDateString() : '';
            var transcriptLabel = (v.transcript && v.transcript.trim()) ? 'Yes' : 'No transcript';
            table += '<tr>' +
                '<td><img class="scraper-thumb-img" src="' + escapeHtml(v.thumbnail) + '" alt="" loading="lazy"></td>' +
                '<td class="scraper-cell-title">' + escapeHtml(v.title) + '</td>' +
                '<td>' + escapeHtml(String(v.view_count).replace(/\B(?=(\d{3})+(?!\d))/g, ',')) + '</td>' +
                '<td>' + escapeHtml(String(v.like_count).replace(/\B(?=(\d{3})+(?!\d))/g, ',')) + '</td>' +
                '<td>' + escapeHtml(v.duration_human) + '</td>' +
                '<td>' + escapeHtml(pubDate) + '</td>' +
                '<td>' + escapeHtml(transcriptLabel) + '</td></tr>';
        });
        table += '</tbody></table></div>';
        resultsEl.innerHTML = '<div class="scraper-results-inner">' + countHtml + btnRow + table + '</div>';

        document.getElementById('scraper-export-transcripts') && document.getElementById('scraper-export-transcripts').addEventListener('click', function () {
            downloadScraperTranscripts(videos);
        });
        document.getElementById('scraper-export-csv') && document.getElementById('scraper-export-csv').addEventListener('click', function () {
            downloadScraperCSV(videos);
        });
        document.getElementById('scraper-export-json') && document.getElementById('scraper-export-json').addEventListener('click', function () {
            downloadScraperJSON(videos);
        });
    }

    function downloadScraperTranscripts(videos) {
        var lines = [];
        videos.forEach(function (v) {
            lines.push(v.title);
            lines.push('');
            lines.push((v.transcript && v.transcript.trim()) ? v.transcript : '[No transcript available]');
            lines.push('');
            lines.push('---');
        });
        var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'youtube-transcripts.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function downloadScraperCSV(videos) {
        if (!videos.length) return;
        var keys = ['category', 'channel', 'channel_id', 'channel_url', 'comment_count', 'description', 'duration_human', 'duration_seconds', 'is_live', 'like_count', 'publish_date', 'tags', 'thumbnail', 'title', 'transcript', 'url', 'video_id', 'view_count'];
        var escapeCsv = function (val) {
            var s = String(val == null ? '' : val);
            if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
            return s;
        };
        var header = keys.join(',');
        var rows = [header];
        videos.forEach(function (v) {
            rows.push(keys.map(function (k) { return escapeCsv(v[k]); }).join(','));
        });
        var blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'youtube-scraper.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function downloadScraperJSON(videos) {
        var json = JSON.stringify(videos, null, 2);
        var blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'youtube-scraper.json';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    // Settings view: Viralzaps-style with tabs (Account, Notifications, Subscription)
    var settingsEyeSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    var settingsEyeOffSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

    var SUBSCRIPTION_PLAN_STORAGE_KEY = 'subscription_plan';
    var BILLING_HISTORY_STORAGE_KEY = 'viralzaps_billing_history';
    var CREDITS_PURCHASED_KEY = 'viralzaps_credits_purchased';
    var CREDITS_USED_KEY = 'viralzaps_credits_used';
    // New plans: 15 days ₹99 (+100 credits/day), 6 months ₹999 (+200 credits/day), Lifetime ₹19999.
    var SUBSCRIPTION_PLAN_NAMES = {
        starter: 'Viralzaps Starter Monthly',
        professional: 'Viralzaps Professional Monthly',
        ultimate: 'Viralzaps Ultimate Monthly',
        plan_15d: 'Viralzaps 15 Days',
        plan_6m: 'Viralzaps 6 Months',
        plan_lifetime: 'Viralzaps Lifetime'
    };
    var SUBSCRIPTION_PLAN_PRICES = {
        starter: '2500',
        professional: '4500',
        ultimate: '8500',
        plan_15d: '99',
        plan_6m: '999',
        plan_lifetime: '19999'
    };
    var CREDITS_BY_PLAN = {
        starter: 95,
        professional: 175,
        ultimate: 300,
        plan_15d: 95,
        plan_6m: 175,
        plan_lifetime: 300
    };

    function getBillingHistory() {
        try {
            var raw = localStorage.getItem(BILLING_HISTORY_STORAGE_KEY);
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function addBillingEntry(entry) {
        if (!entry || !entry.date) return;
        var list = getBillingHistory();
        var item = {
            id: 'inv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
            type: entry.type || 'payment',
            description: entry.description || 'Payment',
            amount: entry.amount,
            currency: entry.currency || 'USD',
            date: entry.date,
            paymentId: entry.paymentId || '',
            orderId: entry.orderId || '',
            status: entry.status || 'paid'
        };
        if (entry.type === 'credits' && entry.credits != null) item.credits = Number(entry.credits) || 0;
        list.unshift(item);
        list = list.slice(0, 100);
        try {
            localStorage.setItem(BILLING_HISTORY_STORAGE_KEY, JSON.stringify(list));
        } catch (e) {}
    }

    function formatBillingAmount(amount, currency) {
        if (amount == null || amount === '') return '—';
        var num = Number(amount) / 100;
        var cur = (currency || 'USD').toUpperCase();
        if (cur === 'USD') return '$' + num.toFixed(2);
        return '₹' + num.toFixed(2);
    }

    function formatBillingDate(isoDate) {
        if (!isoDate) return '—';
        var d = new Date(isoDate);
        if (isNaN(d.getTime())) return isoDate;
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    function getPurchasedCredits() {
        try {
            var v = localStorage.getItem(CREDITS_PURCHASED_KEY);
            return v != null ? Math.max(0, parseInt(v, 10) || 0) : 0;
        } catch (e) { return 0; }
    }

    function addPurchasedCredits(amount) {
        if (!amount || amount < 0) return;
        var current = getPurchasedCredits();
        try {
            localStorage.setItem(CREDITS_PURCHASED_KEY, String(current + amount));
        } catch (e) {}
    }

    function getUsedCredits() {
        try {
            var v = localStorage.getItem(CREDITS_USED_KEY);
            return v != null ? Math.max(0, parseInt(v, 10) || 0) : 0;
        } catch (e) { return 0; }
    }

    function getCreditsState() {
        try {
            var plan = getStoredSubscriptionPlan();
            var planKey;
            var planCredits;
            if (plan && plan.plan && CREDITS_BY_PLAN[plan.plan] != null) {
                planKey = plan.plan;
                planCredits = CREDITS_BY_PLAN[plan.plan];
            } else {
                planKey = 'inactive';
                planCredits = 0;
            }
            var purchased = getPurchasedCredits();
            var used = getUsedCredits();
            var total = (Number(planCredits) || 0) + (Number(purchased) || 0);
            var available = Math.max(0, (Number(total) || 0) - (Number(used) || 0));
            return {
                planKey: planKey,
                planCredits: planCredits,
                purchasedCredits: purchased,
                usedCredits: used,
                totalCredits: total,
                availableCredits: available
            };
        } catch (e) {
            var purchased2 = 0;
            try {
                purchased2 = getPurchasedCredits();
            } catch (e2) {}
            var used2 = 0;
            try {
                used2 = getUsedCredits();
            } catch (e3) {}
            var available2 = Math.max(0, (Number(purchased2) || 0) - (Number(used2) || 0));
            return {
                planKey: 'inactive',
                planCredits: 0,
                purchasedCredits: purchased2,
                usedCredits: used2,
                totalCredits: Number(purchased2) || 0,
                availableCredits: available2
            };
        }
    }

    function updateUsageCreditsUI() {
        try {
            var state = getCreditsState();
            var valueEl = document.getElementById('usage-credits-value');
            var barEl = document.getElementById('usage-credits-bar-fill');
            var badgeEl = document.getElementById('usage-plan-badge');
            if (valueEl) valueEl.textContent = state.availableCredits + ' / ' + state.totalCredits;
            if (barEl) {
                var pct = state.totalCredits > 0 ? Math.min(100, Math.round((state.availableCredits / state.totalCredits) * 100)) : 100;
                barEl.style.width = pct + '%';
            }
            if (badgeEl) {
                var badgeText = (state.planKey || 'inactive').toUpperCase();
                badgeEl.textContent = badgeText;
                var extraClass = state.planKey && /^plan_/.test(state.planKey) ? ' usage-plan-badge-' + state.planKey.replace(/^plan_/, 'plan-') : '';
                badgeEl.className = 'usage-plan-badge' + extraClass;
            }
        } catch (e) {
            console.warn('updateUsageCreditsUI:', e);
        }
    }

    function getStoredSubscriptionPlan() {
        try {
            var raw = localStorage.getItem(SUBSCRIPTION_PLAN_STORAGE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            if (!data || !data.plan || !SUBSCRIPTION_PLAN_NAMES[data.plan]) return null;
            if (data.expiresAt) {
                var exp = new Date(data.expiresAt);
                if (!isNaN(exp.getTime()) && new Date() > exp) return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    }

    function formatRenewalDate(activatedAt, planKey) {
        if (!activatedAt && planKey !== 'plan_lifetime') return '';
        if (planKey === 'plan_lifetime') return 'Lifetime';
        var d = new Date(activatedAt);
        if (planKey === 'plan_15d') d.setDate(d.getDate() + 15);
        else if (planKey === 'plan_6m') d.setMonth(d.getMonth() + 6);
        else d.setMonth(d.getMonth() + 1);
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    function updateSubscriptionPlanUI() {
        var plan = getStoredSubscriptionPlan();
        var nameEl = document.querySelector('.subscription-plan-name');
        var priceEl = document.querySelector('.subscription-plan-price');
        var renewalEl = document.querySelector('.subscription-plan-renewal');
        var badgeEl = document.querySelector('.subscription-plan-row .subscription-plan-badge');
        if (!nameEl) return;
        if (plan) {
            nameEl.textContent = SUBSCRIPTION_PLAN_NAMES[plan.plan] || plan.planName || 'Active Plan';
            if (priceEl) priceEl.textContent = '₹' + (SUBSCRIPTION_PLAN_PRICES[plan.plan] || plan.price || '—');
            if (renewalEl) renewalEl.innerHTML = '<svg class="subscription-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>' + (plan.plan === 'plan_lifetime' ? 'Lifetime access' : 'Valid until ' + formatRenewalDate(plan.activatedAt, plan.plan));
            if (badgeEl) {
                badgeEl.textContent = 'ACTIVE';
                badgeEl.className = 'subscription-plan-badge subscription-plan-badge-active';
            }
        } else {
            nameEl.textContent = 'No active plan';
            if (priceEl) priceEl.textContent = '—';
            if (renewalEl) renewalEl.innerHTML = 'Choose a plan to continue';
            if (badgeEl) {
                badgeEl.textContent = 'INACTIVE';
                badgeEl.className = 'subscription-plan-badge';
            }
        }
    }

    function showSettingsView(container) {
        var currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        var user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        var userEmail = (user && user.email) ? user.email : '';
        var subPlan = getStoredSubscriptionPlan();
        var subPlanName, subPlanPrice, subPlanBadge, subPlanBadgeClass, subRenewal;
        if (subPlan) {
            subPlanName = SUBSCRIPTION_PLAN_NAMES[subPlan.plan] || subPlan.planName || 'Active Plan';
            subPlanPrice = '₹' + (SUBSCRIPTION_PLAN_PRICES[subPlan.plan] || subPlan.price || '—');
            subPlanBadge = 'ACTIVE';
            subPlanBadgeClass = 'subscription-plan-badge subscription-plan-badge-active';
            subRenewal = subPlan.plan === 'plan_lifetime' ? 'Lifetime access' : ('Valid until ' + formatRenewalDate(subPlan.activatedAt, subPlan.plan));
        } else {
            subPlanName = 'No active plan';
            subPlanPrice = '—';
            subPlanBadge = 'INACTIVE';
            subPlanBadgeClass = 'subscription-plan-badge';
            subRenewal = 'Choose a plan to continue';
        }
        var subPlanPeriod = (subPlan && (subPlan.plan === 'starter' || subPlan.plan === 'professional' || subPlan.plan === 'ultimate')) ? '/month' : '';
        var renewalSvg = '<svg class="subscription-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
        container.innerHTML =
            '<div class="settings-view">' +
            '  <header class="settings-header">' +
            '    <h1 class="settings-title">Settings</h1>' +
            '    <p class="settings-subtitle">Manage your account settings and preferences.</p>' +
            '  </header>' +
            '  <div class="settings-tabs" role="tablist">' +
            '    <button type="button" class="settings-tab active" role="tab" id="settings-tab-account" aria-selected="true" aria-controls="settings-panel-account" data-tab="account">Account</button>' +
            '    <button type="button" class="settings-tab" role="tab" id="settings-tab-notifications" aria-selected="false" aria-controls="settings-panel-notifications" data-tab="notifications">Notifications</button>' +
            '    <button type="button" class="settings-tab" role="tab" id="settings-tab-subscription" aria-selected="false" aria-controls="settings-panel-subscription" data-tab="subscription">Subscription</button>' +
            '  </div>' +
            '  <div class="settings-panels">' +
            '    <div class="settings-panel active" id="settings-panel-account" role="tabpanel" aria-labelledby="settings-tab-account">' +
            '      <div class="settings-card">' +
            '        <h2 class="settings-card-title">Account Information</h2>' +
            '        <p class="settings-card-desc">Update your account details and personal information.</p>' +
            '        <div class="settings-field">' +
            '          <label class="settings-label" for="settings-email">Email</label>' +
            '          <input type="email" class="settings-input" id="settings-email" value="' + escapeHtml(userEmail) + '" disabled readonly aria-readonly="true">' +
            '        </div>' +
            '        <p class="settings-hint">Email cannot be changed.</p>' +
            '        <button type="button" class="settings-btn settings-btn-primary" id="settings-save-account">Save Changes</button>' +
            '      </div>' +
            '      <div class="settings-card">' +
            '        <h2 class="settings-card-title">Password</h2>' +
            '        <p class="settings-card-desc">Update your password to keep your account secure.</p>' +
            '        <div class="settings-field">' +
            '          <label class="settings-label" for="settings-current-password">Current Password</label>' +
            '          <div class="settings-input-wrap">' +
            '            <input type="password" class="settings-input" id="settings-current-password" placeholder="Enter current password" autocomplete="current-password">' +
            '            <button type="button" class="settings-password-toggle" id="settings-toggle-current" aria-label="Toggle password visibility">' + settingsEyeSvg + '</button>' +
            '          </div>' +
            '        </div>' +
            '        <div class="settings-field">' +
            '          <label class="settings-label" for="settings-new-password">New Password</label>' +
            '          <div class="settings-input-wrap">' +
            '            <input type="password" class="settings-input" id="settings-new-password" placeholder="Enter new password" autocomplete="new-password">' +
            '            <button type="button" class="settings-password-toggle" id="settings-toggle-new" aria-label="Toggle password visibility">' + settingsEyeSvg + '</button>' +
            '          </div>' +
            '        </div>' +
            '        <div class="settings-field">' +
            '          <label class="settings-label" for="settings-confirm-password">Confirm New Password</label>' +
            '          <div class="settings-input-wrap">' +
            '            <input type="password" class="settings-input" id="settings-confirm-password" placeholder="Confirm new password" autocomplete="new-password">' +
            '            <button type="button" class="settings-password-toggle" id="settings-toggle-confirm" aria-label="Toggle password visibility">' + settingsEyeSvg + '</button>' +
            '          </div>' +
            '        </div>' +
            '        <button type="button" class="settings-btn settings-btn-primary" id="settings-update-password">Update Password</button>' +
            '      </div>' +
            '      <div class="settings-card">' +
            '        <h2 class="settings-card-title">Theme</h2>' +
            '        <p class="settings-card-desc">Choose light or dark appearance.</p>' +
            '        <div class="settings-theme-btns" role="group" aria-label="Theme">' +
            '          <button type="button" class="settings-theme-btn' + (currentTheme === 'light' ? ' active' : '') + '" id="settings-theme-light" data-theme="light">Light</button>' +
            '          <button type="button" class="settings-theme-btn' + (currentTheme === 'dark' ? ' active' : '') + '" id="settings-theme-dark" data-theme="dark">Dark</button>' +
            '        </div>' +
            '      </div>' +
            '    </div>' +
            '    <div class="settings-panel" id="settings-panel-notifications" role="tabpanel" aria-labelledby="settings-tab-notifications" hidden>' +
            '      <div class="settings-card">' +
            '        <h2 class="settings-card-title">Notifications</h2>' +
            '        <p class="settings-card-desc">Manage your notification preferences (coming soon). Email notifications about product updates and new features are planned for the future.</p>' +
            '      </div>' +
            '      <div class="settings-card">' +
            '        <h2 class="settings-card-title">Releases &amp; updates</h2>' +
            '        <p class="settings-card-desc">Latest product updates and new features.</p>' +
            '        <ul class="releases-updates-list" aria-label="Recent releases">' +
            '          <li class="release-item">' +
            '            <span class="release-date">Feb 2025</span>' +
            '            <div class="release-body">' +
            '              <strong class="release-title">Plan selection &amp; subscription UI</strong>' +
            '              <p class="release-desc">Compare plans in a modal, activate any plan with one click. Subscription tab now shows your active plan and renewal date.</p>' +
            '            </div>' +
            '          </li>' +
            '          <li class="release-item">' +
            '            <span class="release-date">Feb 2025</span>' +
            '            <div class="release-body">' +
            '              <strong class="release-title">Dark &amp; light theme</strong>' +
            '              <p class="release-desc">Choose your preferred theme in Settings. Your choice is saved and applied across the dashboard.</p>' +
            '            </div>' +
            '          </li>' +
            '          <li class="release-item">' +
            '            <span class="release-date">Jan 2025</span>' +
            '            <div class="release-body">' +
            '              <strong class="release-title">YouTube discovery &amp; Viral Videos</strong>' +
            '              <p class="release-desc">Search Shorts and long-form videos, find viral content by views, and discover similar channels (Shorts or long-form).</p>' +
            '            </div>' +
            '          </li>' +
            '          <li class="release-item">' +
            '            <span class="release-date">Jan 2025</span>' +
            '            <div class="release-body">' +
            '              <strong class="release-title">Razorpay payments</strong>' +
            '              <p class="release-desc">Choose a plan to continue: 15 Days (₹99 + 100 credits/day), 6 Months (₹999 + 200 credits/day), or Lifetime (₹19,999).</p>' +
            '            </div>' +
            '          </li>' +
            '        </ul>' +
            '      </div>' +
            '    </div>' +
            '    <div class="settings-panel" id="settings-panel-subscription" role="tabpanel" aria-labelledby="settings-tab-subscription" hidden>' +
            '      <div class="settings-card subscription-billing-card">' +
            '        <h2 class="settings-card-title">Subscription & Billing</h2>' +
            '        <p class="settings-card-desc">Manage your plan, billing details, and invoices.</p>' +
            '        <div class="subscription-plan-box">' +
            '          <span class="subscription-plan-label">CURRENT PLAN</span>' +
            '          <div class="subscription-plan-row">' +
            '            <span class="subscription-plan-name">' + escapeHtml(subPlanName) + '</span>' +
            '            <span class="' + escapeHtml(subPlanBadgeClass) + '">' + escapeHtml(subPlanBadge) + '</span>' +
            '          </div>' +
            '          <div class="subscription-plan-price-row">' +
            '            <span class="subscription-plan-price">' + escapeHtml(subPlanPrice) + '</span>' + (subPlanPeriod ? '<span class="subscription-plan-period">' + escapeHtml(subPlanPeriod) + '</span>' : '') +
            '            <span class="subscription-plan-renewal">' + renewalSvg + escapeHtml(subRenewal) + '</span>' +
            '          </div>' +
            '        </div>' +
            '        <div class="subscription-upgrade-box">' +
            '          <div class="subscription-upgrade-content">' +
            '            <svg class="subscription-upgrade-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12 12 0 0 1 22 2c0 2.72-.78 7.5-6 11a22 22 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>' +
            '            <div>' +
            '              <h3 class="subscription-upgrade-title">Upgrade & Unlock More</h3>' +
            '              <p class="subscription-upgrade-desc">Get higher limits, more credits, and priority support instantly.</p>' +
            '            </div>' +
            '          </div>' +
            '          <button type="button" class="settings-btn settings-btn-primary subscription-compare-btn" id="settings-subscription-compare-plans">Compare Plans<svg class="subscription-btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>' +
            '        </div>' +
            '        <div class="subscription-footer">' +
            '          <button type="button" class="settings-btn subscription-footer-btn" id="settings-billing-invoices"><svg class="subscription-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>Billing & Invoices</button>' +
            '          <a href="#" class="subscription-cancel-link" id="settings-cancel-subscription">Cancel Subscription</a>' +
            '        </div>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>';
        var tabs = container.querySelectorAll('.settings-tab');
        var panels = container.querySelectorAll('.settings-panel');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                var tabId = this.getAttribute('data-tab');
                tabs.forEach(function (t) {
                    t.classList.toggle('active', t === tab);
                    t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
                });
                panels.forEach(function (panel) {
                    var match = panel.id === 'settings-panel-' + tabId;
                    panel.classList.toggle('active', match);
                    panel.hidden = !match;
                });
            });
        });
        document.querySelectorAll('.settings-theme-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var theme = this.getAttribute('data-theme');
                if (!theme) return;
                document.documentElement.setAttribute('data-theme', theme);
                localStorage.setItem('theme', theme);
                document.querySelectorAll('.settings-theme-btn').forEach(function (b) {
                    b.classList.toggle('active', b.getAttribute('data-theme') === theme);
                });
            });
        });
        function setupPasswordToggle(btnId, inputId) {
            var btn = document.getElementById(btnId);
            var input = document.getElementById(inputId);
            if (!btn || !input) return;
            btn.addEventListener('click', function () {
                var isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                btn.innerHTML = isPassword ? settingsEyeOffSvg : settingsEyeSvg;
                btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
            });
        }
        setupPasswordToggle('settings-toggle-current', 'settings-current-password');
        setupPasswordToggle('settings-toggle-new', 'settings-new-password');
        setupPasswordToggle('settings-toggle-confirm', 'settings-confirm-password');
        document.getElementById('settings-save-account')?.addEventListener('click', function () {
            var btn = this;
            var orig = btn.textContent;
            btn.textContent = 'Saved!';
            btn.disabled = true;
            setTimeout(function () { btn.textContent = orig; btn.disabled = false; }, 2000);
        });
        document.getElementById('settings-update-password')?.addEventListener('click', function () {
            var current = document.getElementById('settings-current-password')?.value || '';
            var newPwd = document.getElementById('settings-new-password')?.value || '';
            var confirm = document.getElementById('settings-confirm-password')?.value || '';
            if (!newPwd || newPwd.length < 6) {
                alert('Please enter a new password (at least 6 characters).');
                return;
            }
            if (newPwd !== confirm) {
                alert('New password and confirmation do not match.');
                return;
            }
            var user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
            if (!user) {
                alert('You must be signed in to update your password.');
                return;
            }
            if (typeof user.updatePassword === 'function') {
                user.updatePassword(newPwd).then(function () {
                    alert('Password updated successfully.');
                    document.getElementById('settings-current-password').value = '';
                    document.getElementById('settings-new-password').value = '';
                    document.getElementById('settings-confirm-password').value = '';
                }).catch(function (err) {
                    if (err.code === 'auth/requires-recent-login') {
                        alert('For security, please sign out and sign in again, then try updating your password.');
                    } else {
                        alert('Could not update password: ' + (err.message || 'Unknown error'));
                    }
                });
            } else {
                alert('Password update is not available. Use "Forgot password" on the sign-in page to reset.');
            }
        });

        setupRazorpayHandlers(container);
    }

    function setupRazorpayHandlers(container) {
        var config = typeof window !== 'undefined' && window.RAZORPAY_CONFIG;
        if (!config || !config.keyId || config.keyId.indexOf('xxxx') !== -1 || !config.apiBaseUrl) {
            return;
        }
        var user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        var userEmail = (user && user.email) ? user.email : '';
        var userName = (user && user.displayName) ? user.displayName : '';

        var planAmounts = { plan_15d: 9900, plan_6m: 99900, plan_lifetime: 1999900 };
        var planShortNames = { plan_15d: '15 Days', plan_6m: '6 Months', plan_lifetime: 'Lifetime' };
        var planFeatures = {
            plan_15d: '15 days access + 100 credits/day',
            plan_6m: '6 months access + 200 credits/day',
            plan_lifetime: 'Lifetime access'
        };

        function closePlansModal() {
            var el = document.getElementById('plans-modal');
            if (el) {
                el.classList.remove('plans-modal-open');
                document.body.style.overflow = '';
                document.removeEventListener('keydown', plansModalEscHandler);
            }
        }
        function plansModalEscHandler(e) {
            if (e.key === 'Escape') closePlansModal();
        }

        function showPlansModal() {
            var existing = document.getElementById('plans-modal');
            if (existing) {
                existing.classList.add('plans-modal-open');
                document.body.style.overflow = 'hidden';
                document.addEventListener('keydown', plansModalEscHandler);
                return;
            }
            var modal = document.createElement('div');
            modal.id = 'plans-modal';
            modal.className = 'plans-modal plans-modal-open';
            modal.innerHTML =
                '<div class="plans-modal-overlay" id="plans-modal-overlay"></div>' +
                '<div class="plans-modal-content">' +
                '  <button type="button" class="plans-modal-close" id="plans-modal-close" aria-label="Close">×</button>' +
                '  <h2 class="plans-modal-title">Choose your plan</h2>' +
                '  <p class="plans-modal-subtitle">Pick a plan and complete payment to continue.</p>' +
                '  <div class="plans-grid">' +
                '    <div class="plan-card" data-plan="plan_15d">' +
                '      <div class="plan-card-header">' +
                '        <h3 class="plan-card-name">15 Days</h3>' +
                '        <div class="plan-card-price-wrap"><span class="plan-card-price">₹99</span><span class="plan-card-period">/15 days</span></div>' +
                '      </div>' +
                '      <p class="plan-card-features">15 days access + 100 credits/day</p>' +
                '      <button type="button" class="plan-card-activate settings-btn settings-btn-primary">Activate</button>' +
                '    </div>' +
                '    <div class="plan-card plan-card-featured" data-plan="plan_6m">' +
                '      <span class="plan-card-badge">Best value</span>' +
                '      <div class="plan-card-header">' +
                '        <h3 class="plan-card-name">6 Months</h3>' +
                '        <div class="plan-card-price-wrap"><span class="plan-card-price">₹999</span><span class="plan-card-period">/6 months</span></div>' +
                '      </div>' +
                '      <p class="plan-card-features">6 months access + 200 credits/day</p>' +
                '      <button type="button" class="plan-card-activate settings-btn settings-btn-primary">Activate</button>' +
                '    </div>' +
                '    <div class="plan-card" data-plan="plan_lifetime">' +
                '      <div class="plan-card-header">' +
                '        <h3 class="plan-card-name">Lifetime</h3>' +
                '        <div class="plan-card-price-wrap"><span class="plan-card-price">₹19,999</span><span class="plan-card-period"> one-time</span></div>' +
                '      </div>' +
                '      <p class="plan-card-features">Lifetime access</p>' +
                '      <button type="button" class="plan-card-activate settings-btn settings-btn-primary">Activate</button>' +
                '    </div>' +
                '  </div>' +
                '</div>';
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', plansModalEscHandler);
            document.getElementById('plans-modal-overlay').addEventListener('click', closePlansModal);
            document.getElementById('plans-modal-close').addEventListener('click', closePlansModal);
            document.querySelectorAll('.plan-card-activate').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var card = this.closest('.plan-card');
                    var plan = card && card.getAttribute('data-plan');
                    if (!plan || !planAmounts[plan]) return;
                    closePlansModal();
                    startPlanCheckout(plan);
                });
            });
        }

        function startPlanCheckout(plan) {
            var amountPaise = planAmounts[plan];
            fetch(config.apiBaseUrl + '/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                    amount: amountPaise,
                    currency: 'INR',
                    receipt: 'plan_' + plan + '_' + Date.now(),
                    notes: { plan: plan, customer_email: userEmail, customer_name: userName }
                })
            }).then(function (r) { return r.json(); }).then(function (data) {
                if (data.error) throw new Error(data.error);
                var options = {
                    key: config.keyId,
                    order_id: data.orderId,
                    amount: data.amount,
                    currency: data.currency || 'INR',
                    name: 'Viralzaps',
                    description: planShortNames[plan] + ' Plan (Subscription)',
                    prefill: { email: userEmail, name: userName },
                    handler: function (res) {
                        var activatedAt = Date.now();
                        var planData = {
                            plan: plan,
                            planName: SUBSCRIPTION_PLAN_NAMES[plan],
                            price: SUBSCRIPTION_PLAN_PRICES[plan],
                            activatedAt: activatedAt,
                            firebaseUid: user && user.uid ? user.uid : undefined
                        };
                        if (plan === 'plan_15d') {
                            var d15 = new Date(activatedAt);
                            d15.setDate(d15.getDate() + 15);
                            planData.expiresAt = d15.toISOString();
                        } else if (plan === 'plan_6m') {
                            var d6 = new Date(activatedAt);
                            d6.setMonth(d6.getMonth() + 6);
                            planData.expiresAt = d6.toISOString();
                        }
                        try {
                            localStorage.setItem(SUBSCRIPTION_PLAN_STORAGE_KEY, JSON.stringify(planData));
                        } catch (e) {}
                        addBillingEntry({
                            type: 'subscription',
                            description: SUBSCRIPTION_PLAN_NAMES[plan] + (plan === 'plan_lifetime' ? ' – Lifetime' : ''),
                            amount: data.amount,
                            currency: data.currency || 'INR',
                            date: new Date().toISOString(),
                            paymentId: res.razorpay_payment_id,
                            orderId: res.razorpay_order_id || data.orderId,
                            status: 'paid'
                        });
                        updateSubscriptionPlanUI();
                        updateUsageCreditsUI();
                        alert('Payment successful. Subscription activated. Thank you!');
                        var payload = {
                            order_id: res.razorpay_order_id || data.orderId,
                            payment_id: res.razorpay_payment_id,
                            signature: res.razorpay_signature,
                            customer_name: userName,
                            customer_email: userEmail
                        };
                        fetch(config.apiBaseUrl + '/api/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        }).then(function (v) { return v.json(); }).then(function (v) {
                            if (!v.verified) console.warn('Payment verification pending. Payment ID:', res.razorpay_payment_id);
                        }).catch(function (err) {
                            console.warn('Verify request failed (payment succeeded on Razorpay):', err);
                        });
                    }
                };
                var rzp = new Razorpay(options);
                rzp.on('payment.failed', function (res) {
                    alert('Payment failed: ' + (res.error && res.error.description ? res.error.description : 'Unknown error'));
                });
                rzp.open();
            }).catch(function (err) {
                alert('Could not start checkout: ' + (err.message || 'Network error') + '. Is the backend running on ' + config.apiBaseUrl + '?');
            });
        }

        document.getElementById('settings-subscription-compare-plans')?.addEventListener('click', function () {
            showPlansModal();
        });

        function showBillingInvoicesModal() {
            var existing = document.getElementById('billing-invoices-modal');
            if (existing) {
                existing.classList.add('billing-invoices-modal-open');
                var listEl = document.getElementById('billing-invoices-list');
                if (listEl) renderBillingInvoicesList(listEl);
                return;
            }
            var history = getBillingHistory();
            var listHtml = history.length === 0
                ? '<tr><td colspan="5" class="billing-invoices-empty">No billing history yet. Payments you make for plans or credits will appear here.</td></tr>'
                : history.map(function (entry) {
                    return '<tr class="billing-invoices-row">' +
                        '<td class="billing-invoices-date">' + escapeHtml(formatBillingDate(entry.date)) + '</td>' +
                        '<td class="billing-invoices-desc">' + escapeHtml(entry.description || 'Payment') + '</td>' +
                        '<td class="billing-invoices-amount">' + escapeHtml(formatBillingAmount(entry.amount, entry.currency)) + '</td>' +
                        '<td class="billing-invoices-status"><span class="billing-invoices-badge billing-invoices-badge-paid">' + escapeHtml(entry.status || 'Paid') + '</span></td>' +
                        '<td class="billing-invoices-id">' + (entry.paymentId ? '<span class="billing-invoices-id-text" title="' + escapeHtml(entry.paymentId) + '">' + escapeHtml(entry.paymentId.slice(0, 12) + '…') + '</span>' : '—') + '</td>' +
                        '</tr>';
                }).join('');
            var modal = document.createElement('div');
            modal.id = 'billing-invoices-modal';
            modal.className = 'billing-invoices-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-labelledby', 'billing-invoices-title');
            modal.innerHTML =
                '<div class="billing-invoices-overlay" id="billing-invoices-overlay"></div>' +
                '<div class="billing-invoices-content">' +
                '<button type="button" class="billing-invoices-close" id="billing-invoices-close" aria-label="Close">&times;</button>' +
                '<h2 class="billing-invoices-title" id="billing-invoices-title">Billing & Invoices</h2>' +
                '<p class="billing-invoices-subtitle">Your payment history. Payments for subscription plans and credit packs appear here.</p>' +
                '<div class="billing-invoices-table-wrap">' +
                '<table class="billing-invoices-table">' +
                '<thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th><th>Payment ID</th></tr></thead>' +
                '<tbody id="billing-invoices-list">' + listHtml + '</tbody>' +
                '</table>' +
                '</div>' +
                '</div>';
            document.body.appendChild(modal);
            requestAnimationFrame(function () { modal.classList.add('billing-invoices-modal-open'); });
            document.body.style.overflow = 'hidden';
            document.getElementById('billing-invoices-overlay').addEventListener('click', closeBillingInvoicesModal);
            document.getElementById('billing-invoices-close').addEventListener('click', closeBillingInvoicesModal);
            document.addEventListener('keydown', function onBillingEsc(e) {
                if (e.key === 'Escape') {
                    closeBillingInvoicesModal();
                    document.removeEventListener('keydown', onBillingEsc);
                }
            });
        }

        function renderBillingInvoicesList(container) {
            if (!container) return;
            var history = getBillingHistory();
            if (history.length === 0) {
                container.innerHTML = '<tr><td colspan="5" class="billing-invoices-empty">No billing history yet. Payments you make for plans or credits will appear here.</td></tr>';
                return;
            }
            container.innerHTML = history.map(function (entry) {
                return '<tr class="billing-invoices-row">' +
                    '<td class="billing-invoices-date">' + escapeHtml(formatBillingDate(entry.date)) + '</td>' +
                    '<td class="billing-invoices-desc">' + escapeHtml(entry.description || 'Payment') + '</td>' +
                    '<td class="billing-invoices-amount">' + escapeHtml(formatBillingAmount(entry.amount, entry.currency)) + '</td>' +
                    '<td class="billing-invoices-status"><span class="billing-invoices-badge billing-invoices-badge-paid">' + escapeHtml(entry.status || 'Paid') + '</span></td>' +
                    '<td class="billing-invoices-id">' + (entry.paymentId ? '<span class="billing-invoices-id-text" title="' + escapeHtml(entry.paymentId) + '">' + escapeHtml(entry.paymentId.slice(0, 12) + '…') + '</span>' : '—') + '</td>' +
                    '</tr>';
            }).join('');
        }

        function closeBillingInvoicesModal() {
            var el = document.getElementById('billing-invoices-modal');
            if (el) {
                el.classList.remove('billing-invoices-modal-open');
                document.body.style.overflow = '';
            }
        }

        document.getElementById('settings-billing-invoices')?.addEventListener('click', function () {
            showBillingInvoicesModal();
        });

        document.getElementById('settings-cancel-subscription')?.addEventListener('click', function (e) {
            e.preventDefault();
            var msg = 'To cancel or change your subscription, please contact us at support@viralzaps.com. Your current plan remains active until the end of the billing period.';
            if (typeof alert === 'function') alert(msg);
        });

    }

    // Home view: YouTube-style category tabs + video grid (default on load)
    var HOME_CATEGORIES = [
        { id: 'all', label: 'All', query: 'viral trending' },
        { id: 'music', label: 'Music', query: 'music' },
        { id: 'podcasts', label: 'Podcasts', query: 'podcasts' },
        { id: 'mixes', label: 'Mixes', query: 'mixes' },
        { id: 'mukbang', label: 'Mukbang', query: 'mukbang' },
        { id: 'soap', label: 'Indian soap operas', query: 'Indian soap operas' },
        { id: 'streetfood', label: 'Street food', query: 'street food' },
        { id: 'gaming', label: 'Gaming', query: 'gaming' },
        { id: 'comedy', label: 'Comedy', query: 'comedy' },
        { id: 'vlogs', label: 'Vlogs', query: 'vlogs' },
        { id: 'education', label: 'Education', query: 'education' },
        { id: 'tech', label: 'Tech', query: 'tech review' },
        { id: 'beauty', label: 'Beauty', query: 'beauty makeup' },
        { id: 'travel', label: 'Travel', query: 'travel vlog' }
    ];

    function showHomeView(container) {
        var tabsHtml = '<div class="home-tabs-wrap"><div class="home-tabs" id="home-tabs" role="tablist">';
        HOME_CATEGORIES.forEach(function (cat, i) {
            var activeClass = i === 0 ? ' active' : '';
            tabsHtml += '<button type="button" class="home-tab' + activeClass + '" role="tab" data-category-id="' + escapeHtml(cat.id) + '" data-query="' + escapeHtml(cat.query) + '">' + escapeHtml(cat.label) + '</button>';
        });
        tabsHtml += '<span class="home-tabs-chevron" aria-hidden="true">&gt;</span></div></div>';
        container.innerHTML =
            '<div class="home-view">' +
            tabsHtml +
            '<div class="home-results" id="home-results"></div>' +
            '</div>';
        var resultsEl = document.getElementById('home-results');
        var tabs = container.querySelectorAll('.home-tab');
        function setActiveTab(btn) {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            if (btn) btn.classList.add('active');
        }
        function loadCategory(btn) {
            var query = btn.getAttribute('data-query') || 'viral';
            var catId = btn.getAttribute('data-category-id') || 'all';
            setActiveTab(btn);
            searchYouTubeHome(query, resultsEl, { categoryId: catId });
        }
        tabs.forEach(function (btn) {
            btn.addEventListener('click', function () { loadCategory(btn); });
        });
        loadCategory(tabs[0]);
    }

    // Shorts view: search bar + dropdowns + YouTube API results
    function showShortsView(container) {
        container.innerHTML =
            '<div class="shorts-view">' +
            '  <h2 class="shorts-title">Shorts</h2>' +
            '  <form class="shorts-search-form" id="shorts-search-form">' +
            '    <div class="shorts-search-wrap">' +
            '      <input type="search" class="shorts-search-input" id="shorts-search-input" placeholder="Search short videos on YouTube..." autocomplete="off" required>' +
            '      <button type="submit" class="shorts-search-btn" id="shorts-search-btn">Search</button>' +
            '    </div>' +
            buildFilterDropdowns('shorts-quick-filter', 'shorts-sorted-by') +
            '  </form>' +
            '  <div class="shorts-results" id="shorts-results"></div>' +
            '</div>';
        initFilterDropdowns(container);
        var form = document.getElementById('shorts-search-form');
        var resultsEl = document.getElementById('shorts-results');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var input = document.getElementById('shorts-search-input');
                var q = (input && input.value) ? input.value.trim() : '';
                if (!q) return;
                recordViralzapsSearch(q);
                searchYouTubeShorts(q, resultsEl);
            });
        }
        // Default: show a few shorts so the page isn't empty
        searchYouTubeShorts('viral', resultsEl);
    }

    // Longform view: search bar + dropdowns + YouTube API results (full-length videos)
    function showLongformView(container) {
        container.innerHTML =
            '<div class="longform-view">' +
            '  <h2 class="longform-title">Longform</h2>' +
            '  <form class="longform-search-form" id="longform-search-form">' +
            '    <div class="longform-search-wrap">' +
            '      <input type="search" class="longform-search-input" id="longform-search-input" placeholder="Search long-form videos on YouTube..." autocomplete="off" required>' +
            '      <button type="submit" class="longform-search-btn" id="longform-search-btn">Search</button>' +
            '    </div>' +
            buildFilterDropdowns('longform-quick-filter', 'longform-sorted-by') +
            '  </form>' +
            '  <div class="longform-results" id="longform-results"></div>' +
            '</div>';
        initFilterDropdowns(container);
        var form = document.getElementById('longform-search-form');
        var resultsEl = document.getElementById('longform-results');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var input = document.getElementById('longform-search-input');
                var q = (input && input.value) ? input.value.trim() : '';
                if (!q) return;
                recordViralzapsSearch(q);
                searchYouTubeLongform(q, resultsEl);
            });
        }
        // Default: show a few long-form videos so the page isn't empty
        searchYouTubeLongform('entertainment', resultsEl);
    }

    // Viral Videos view: search bar + Sorted by dropdown + Short/Longform + Advance
    var viralAdvancedFilters = null; // applied advanced filter state

    function buildViralAdvancedModalHTML() {
        var uploadDateLabels = ['This week'];
        for (var w = 1; w <= 52; w++) {
            if (w === 52) {
                uploadDateLabels.push('12 months ago');
            } else if (w % 4 === 0) {
                uploadDateLabels.push((w / 4) + ' month' + (w === 4 ? '' : 's') + ' ago');
            } else {
                uploadDateLabels.push(w + ' week' + (w === 1 ? '' : 's') + ' ago');
            }
        }
        var weekOptsLeft = uploadDateLabels.map(function (label, i) {
            return '<option value="' + i + '">' + escapeHtml(label) + '</option>';
        }).join('');
        var weekOptsRight = uploadDateLabels.map(function (label, i) {
            var sel = i === 52 ? ' selected' : '';
            return '<option value="' + i + '"' + sel + '>' + escapeHtml(label) + '</option>';
        }).join('');
        return '<div class="viral-advanced-overlay" id="viral-advanced-overlay" aria-hidden="true">' +
            '<div class="viral-advanced-modal" role="dialog" aria-labelledby="viral-advanced-title" aria-modal="true">' +
            '<div class="viral-advanced-header">' +
            '<h3 class="viral-advanced-title" id="viral-advanced-title">Advanced Filters</h3>' +
            '<button type="button" class="viral-advanced-close" id="viral-advanced-close" aria-label="Close">&times;</button>' +
            '</div>' +
            '<div class="viral-advanced-body">' +
            '<div class="viral-advanced-field">' +
            '<label class="viral-advanced-label">Video View Count</label>' +
            '<div class="viral-advanced-inputs">' +
            '<input type="text" class="viral-advanced-input viral-advanced-min" id="viral-filter-views-min" value="0" placeholder="Min">' +
            '<input type="text" class="viral-advanced-input viral-advanced-max" id="viral-filter-views-max" value="100.0M" placeholder="Max">' +
            '</div>' +
            '<div class="viral-advanced-range-wrap viral-advanced-range-views" data-min-id="viral-filter-views-min" data-max-id="viral-filter-views-max" data-min-val="0" data-max-val="9" data-log="true">' +
            '<input type="range" class="viral-advanced-range viral-advanced-range-low" min="0" max="9" step="0.01" value="0" aria-hidden="true" tabindex="-1">' +
            '<input type="range" class="viral-advanced-range viral-advanced-range-high" min="0" max="9" step="0.01" value="8" aria-hidden="true" tabindex="-1">' +
            '<span class="viral-advanced-thumb viral-advanced-thumb-low" role="slider" aria-valuemin="0" aria-valuemax="9" aria-valuenow="0"></span>' +
            '<span class="viral-advanced-thumb viral-advanced-thumb-high" role="slider" aria-valuemin="0" aria-valuemax="9" aria-valuenow="8"></span>' +
            '</div>' +
            '</div>' +
            '<div class="viral-advanced-field">' +
            '<label class="viral-advanced-label">Channel Subscriber Count</label>' +
            '<div class="viral-advanced-inputs">' +
            '<input type="text" class="viral-advanced-input viral-advanced-min" id="viral-filter-subs-min" value="0" placeholder="Min">' +
            '<input type="text" class="viral-advanced-input viral-advanced-max" id="viral-filter-subs-max" value="50.0M" placeholder="Max">' +
            '</div>' +
            '<div class="viral-advanced-range-wrap viral-advanced-range-subs" data-min-id="viral-filter-subs-min" data-max-id="viral-filter-subs-max" data-min-val="0" data-max-val="50000000">' +
            '<input type="range" class="viral-advanced-range viral-advanced-range-low" min="0" max="50000000" step="500000" value="0" aria-hidden="true" tabindex="-1">' +
            '<input type="range" class="viral-advanced-range viral-advanced-range-high" min="0" max="50000000" step="500000" value="50000000" aria-hidden="true" tabindex="-1">' +
            '<span class="viral-advanced-thumb viral-advanced-thumb-low" role="slider"></span>' +
            '<span class="viral-advanced-thumb viral-advanced-thumb-high" role="slider"></span>' +
            '</div>' +
            '</div>' +
            '<div class="viral-advanced-field">' +
            '<label class="viral-advanced-label">Upload Date (Weeks Ago)</label>' +
            '<div class="viral-advanced-inputs viral-advanced-selects">' +
            '<select class="viral-advanced-select viral-advanced-min" id="viral-filter-weeks-min">' + weekOptsLeft + '</select>' +
            '<select class="viral-advanced-select viral-advanced-max" id="viral-filter-weeks-max">' + weekOptsRight + '</select>' +
            '</div>' +
            '<div class="viral-advanced-range-wrap viral-advanced-range-weeks" data-min-id="viral-filter-weeks-min" data-max-id="viral-filter-weeks-max" data-min-val="0" data-max-val="52">' +
            '<input type="range" class="viral-advanced-range viral-advanced-range-low" min="0" max="52" step="1" value="0" aria-hidden="true" tabindex="-1">' +
            '<input type="range" class="viral-advanced-range viral-advanced-range-high" min="0" max="52" step="1" value="52" aria-hidden="true" tabindex="-1">' +
            '<span class="viral-advanced-thumb viral-advanced-thumb-low" role="slider"></span>' +
            '<span class="viral-advanced-thumb viral-advanced-thumb-high" role="slider"></span>' +
            '</div>' +
            '</div>' +
            '<div class="viral-advanced-field">' +
            '<label class="viral-advanced-label">Channel Upload Count</label>' +
            '<div class="viral-advanced-inputs">' +
            '<input type="text" class="viral-advanced-input viral-advanced-min" id="viral-filter-uploads-min" value="0" placeholder="Min">' +
            '<input type="text" class="viral-advanced-input viral-advanced-max" id="viral-filter-uploads-max" value="10.0K" placeholder="Max">' +
            '</div>' +
            '<div class="viral-advanced-range-wrap" data-min-id="viral-filter-uploads-min" data-max-id="viral-filter-uploads-max" data-min-val="0" data-max-val="10000">' +
            '<input type="range" class="viral-advanced-range viral-advanced-range-low" min="0" max="10000" step="100" value="0" aria-hidden="true" tabindex="-1">' +
            '<input type="range" class="viral-advanced-range viral-advanced-range-high" min="0" max="10000" step="100" value="10000" aria-hidden="true" tabindex="-1">' +
            '<span class="viral-advanced-thumb viral-advanced-thumb-low" role="slider"></span>' +
            '<span class="viral-advanced-thumb viral-advanced-thumb-high" role="slider"></span>' +
            '</div>' +
            '</div>' +
            '<div class="viral-advanced-field">' +
            '<label class="viral-advanced-label">Languages</label>' +
            '<input type="text" class="viral-advanced-input viral-advanced-full" id="viral-filter-languages" placeholder="Search languages...">' +
            '</div>' +
            '</div>' +
            '<div class="viral-advanced-footer">' +
            '<button type="button" class="viral-advanced-btn viral-advanced-cancel" id="viral-advanced-cancel">Cancel</button>' +
            '<button type="button" class="viral-advanced-btn viral-advanced-apply" id="viral-advanced-apply">Apply</button>' +
            '</div>' +
            '</div></div>';
    }

    function parseCountStr(str) {
        if (str === '' || str == null) return null;
        var s = String(str).trim().replace(/,/g, '');
        var num = parseFloat(s);
        if (isNaN(num)) return null;
        if (/K$/i.test(s)) return num * 1e3;
        if (/M$/i.test(s)) return num * 1e6;
        if (/B$/i.test(s)) return num * 1e9;
        return num;
    }

    function getViralAdvancedFilterState() {
        var viewsMinEl = document.getElementById('viral-filter-views-min');
        var viewsMaxEl = document.getElementById('viral-filter-views-max');
        var subsMinEl = document.getElementById('viral-filter-subs-min');
        var subsMaxEl = document.getElementById('viral-filter-subs-max');
        var weeksMinEl = document.getElementById('viral-filter-weeks-min');
        var weeksMaxEl = document.getElementById('viral-filter-weeks-max');
        var uploadsMinEl = document.getElementById('viral-filter-uploads-min');
        var uploadsMaxEl = document.getElementById('viral-filter-uploads-max');
        var languagesEl = document.getElementById('viral-filter-languages');
        var viewsMin = parseCountStr(viewsMinEl ? viewsMinEl.value : '');
        var viewsMax = parseCountStr(viewsMaxEl ? viewsMaxEl.value : '');
        var subsMin = parseCountStr(subsMinEl ? subsMinEl.value : '');
        var subsMax = parseCountStr(subsMaxEl ? subsMaxEl.value : '');
        var weeksMin = weeksMinEl ? parseInt(weeksMinEl.value, 10) : 0;
        var weeksMax = weeksMaxEl ? parseInt(weeksMaxEl.value, 10) : 52;
        var uploadsMin = parseCountStr(uploadsMinEl ? uploadsMinEl.value : '');
        var uploadsMax = parseCountStr(uploadsMaxEl ? uploadsMaxEl.value : '');
        var languages = (languagesEl && languagesEl.value) ? languagesEl.value.trim() : '';
        return {
            viewCountMin: viewsMin != null ? viewsMin : 0,
            viewCountMax: viewsMax != null ? viewsMax : 1e9,
            subscriberCountMin: subsMin != null ? subsMin : 0,
            subscriberCountMax: subsMax != null ? subsMax : 1e9,
            uploadWeeksMin: weeksMin,
            uploadWeeksMax: weeksMax,
            channelUploadMin: uploadsMin != null ? uploadsMin : 0,
            channelUploadMax: uploadsMax != null ? uploadsMax : 1e9,
            languages: languages ? languages.split(/\s*,\s*/).map(function (x) { return x.trim(); }).filter(Boolean) : []
        };
    }

    function showViralView(container) {
        container.innerHTML =
            '<div class="viral-view viral-discovery-view">' +
            '  <header class="viral-discovery-hero">' +
            '    <h1 class="viral-title">Discover Viral Videos</h1>' +
            '    <p class="viral-subtitle">Access trending content and find high-view videos to inspire your next upload.</p>' +
            '  </header>' +
            '  <form class="viral-search-form" id="viral-search-form">' +
            '    <div class="viral-search-wrap">' +
            '      <input type="search" class="viral-search-input" id="viral-search-input" placeholder="Search viral videos on YouTube..." autocomplete="off" required>' +
            '      <button type="submit" class="viral-search-btn" id="viral-search-btn">Search</button>' +
            '    </div>' +
            '    <div class="viral-filters-row">' +
            '      <span class="viral-sort-label">Sort:</span>' +
            '      <select class="viral-sorted-select" id="viral-sorted-by" aria-label="Sort by">' +
            '        <option value="viewCount">Views</option>' +
            '        <option value="date">Recently Added</option>' +
            '        <option value="date">Upload Date</option>' +
            '      </select>' +
            '      <div class="viral-type-btns" role="group" aria-label="Video type">' +
            '        <button type="button" class="viral-type-btn active" id="viral-short-btn" data-type="short">Shorts</button>' +
            '        <button type="button" class="viral-type-btn" id="viral-longform-btn" data-type="longform">Longform</button>' +
            '      </div>' +
            '      <button type="button" class="viral-advance-btn" id="viral-advance-btn">Filters</button>' +
            '    </div>' +
            '  </form>' +
            '  <div class="viral-results" id="viral-results"></div>' +
            '</div>';
        var viralViewEl = container.querySelector('.viral-view');
        if (viralViewEl) {
            viralViewEl.insertAdjacentHTML('beforeend', buildViralAdvancedModalHTML());
        }
        var form = document.getElementById('viral-search-form');
        var resultsEl = document.getElementById('viral-results');
        var sortedSelect = document.getElementById('viral-sorted-by');
        var shortBtn = document.getElementById('viral-short-btn');
        var longformBtn = document.getElementById('viral-longform-btn');
        var advanceBtn = document.getElementById('viral-advance-btn');
        var viralType = 'short';
        var lastViralQuery = 'viral';

        function runViralSearch() {
            var input = document.getElementById('viral-search-input');
            var q = (input && input.value) ? input.value.trim() : lastViralQuery;
            if (!q) q = lastViralQuery;
            lastViralQuery = q;
            var order = (sortedSelect && sortedSelect.value) ? sortedSelect.value : 'viewCount';
            var opts = { order: order, videoDuration: viralType === 'short' ? 'short' : 'long' };
            opts.advancedFilters = viralAdvancedFilters;
            searchYouTubeViral(q, resultsEl, opts);
        }

        function openAdvancedModal() {
            var overlay = document.getElementById('viral-advanced-overlay');
            if (overlay) {
                overlay.classList.add('viral-advanced-open');
                overlay.setAttribute('aria-hidden', 'false');
                if (!overlay.hasAttribute('data-sliders-inited')) {
                    initViralAdvancedSliders(overlay);
                    overlay.setAttribute('data-sliders-inited', 'true');
                }
            }
        }

        function closeAdvancedModal() {
            var overlay = document.getElementById('viral-advanced-overlay');
            if (overlay) {
                overlay.classList.remove('viral-advanced-open');
                overlay.setAttribute('aria-hidden', 'true');
            }
        }

        document.getElementById('viral-advanced-close')?.addEventListener('click', closeAdvancedModal);
        document.getElementById('viral-advanced-cancel')?.addEventListener('click', closeAdvancedModal);
        document.getElementById('viral-advanced-overlay')?.addEventListener('click', function (e) {
            if (e.target.id === 'viral-advanced-overlay') closeAdvancedModal();
        });
        document.addEventListener('keydown', function onViralAdvancedKeydown(e) {
            var overlay = document.getElementById('viral-advanced-overlay');
            if (e.key === 'Escape' && overlay && overlay.classList.contains('viral-advanced-open')) {
                closeAdvancedModal();
            }
        });
        document.getElementById('viral-advanced-apply')?.addEventListener('click', function () {
            viralAdvancedFilters = getViralAdvancedFilterState();
            closeAdvancedModal();
            runViralSearch();
        });

        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var input = document.getElementById('viral-search-input');
                var q = (input && input.value) ? input.value.trim() : '';
                if (!q) return;
                lastViralQuery = q;
                recordViralzapsSearch(q);
                runViralSearch();
            });
        }
        if (sortedSelect) {
            sortedSelect.addEventListener('change', runViralSearch);
        }
        if (shortBtn) {
            shortBtn.addEventListener('click', function () {
                viralType = 'short';
                shortBtn.classList.add('active');
                if (longformBtn) longformBtn.classList.remove('active');
                runViralSearch();
            });
        }
        if (longformBtn) {
            longformBtn.addEventListener('click', function () {
                viralType = 'longform';
                longformBtn.classList.add('active');
                if (shortBtn) shortBtn.classList.remove('active');
                runViralSearch();
            });
        }
        if (advanceBtn) {
            advanceBtn.addEventListener('click', openAdvancedModal);
        }
        runViralSearch();
    }

    function setThumbPosition(thumb, pct) {
        if (!thumb) return;
        thumb.style.left = Math.max(0, Math.min(100, pct * 100)) + '%';
    }

    function initDualRangeDrag(wrap, lowInput, highInput, minVal, maxVal, isLog, toLog, fromLog) {
        var thumbLow = wrap.querySelector('.viral-advanced-thumb-low');
        var thumbHigh = wrap.querySelector('.viral-advanced-thumb-high');
        var minId = wrap.getAttribute('data-min-id');
        var maxId = wrap.getAttribute('data-max-id');
        var minIn = minId ? document.getElementById(minId) : null;
        var maxIn = maxId ? document.getElementById(maxId) : null;
        if (!thumbLow || !thumbHigh || !lowInput || !highInput) return;
        function valueToPct(val) {
            if (isLog) return (val - minVal) / (maxVal - minVal || 1);
            return (parseFloat(val, 10) - minVal) / (maxVal - minVal || 1);
        }
        function syncUI() {
            var l = parseFloat(lowInput.value, 10);
            var h = parseFloat(highInput.value, 10);
            if (l > h) { lowInput.value = h; l = h; }
            setThumbPosition(thumbLow, valueToPct(l));
            setThumbPosition(thumbHigh, valueToPct(h));
            updateRangeFill(wrap, valueToPct(l), valueToPct(h));
            if (minIn) {
                if (minIn.tagName === 'SELECT') minIn.value = Math.round(l);
                else minIn.value = isLog && fromLog ? formatCountDecimal(fromLog(l)) : formatCountDecimal(l);
            }
            if (maxIn) {
                if (maxIn.tagName === 'SELECT') maxIn.value = Math.round(h);
                else maxIn.value = isLog && fromLog ? formatCountDecimal(fromLog(h)) : formatCountDecimal(h);
            }
        }
        function startDrag(thumb, isLow, startClientX) {
            var rect = wrap.getBoundingClientRect();
            var range = maxVal - minVal || 1;
            function move(clientX) {
                var pct = (clientX - rect.left) / rect.width;
                pct = Math.max(0, Math.min(1, pct));
                var val;
                if (isLog && fromLog) {
                    val = minVal + pct * (maxVal - minVal);
                    val = Math.max(minVal, Math.min(maxVal, val));
                } else {
                    val = minVal + pct * range;
                    val = Math.round(val);
                    if (wrap.querySelector('select')) val = Math.round(val);
                }
                if (isLow) {
                    var h = parseFloat(highInput.value, 10);
                    val = Math.min(val, h);
                    lowInput.value = val;
                } else {
                    var l = parseFloat(lowInput.value, 10);
                    val = Math.max(val, l);
                    highInput.value = val;
                }
                syncUI();
            }
            function onMove(e) {
                move(e.touches ? e.touches[0].clientX : e.clientX);
            }
            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.removeEventListener('touchmove', onMove, { passive: false });
                document.removeEventListener('touchend', onUp);
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onUp);
            move(startClientX);
        }
        function setThumbFromClientX(isLow, clientX) {
            var rect = wrap.getBoundingClientRect();
            var pct = (clientX - rect.left) / rect.width;
            pct = Math.max(0, Math.min(1, pct));
            var range = maxVal - minVal || 1;
            var val;
            if (isLog) {
                val = minVal + pct * (maxVal - minVal);
                val = Math.max(minVal, Math.min(maxVal, val));
            } else {
                val = minVal + pct * range;
                val = Math.round(val);
            }
            if (isLow) {
                var h = parseFloat(highInput.value, 10);
                val = Math.min(val, h);
                lowInput.value = val;
            } else {
                var l = parseFloat(lowInput.value, 10);
                val = Math.max(val, l);
                highInput.value = val;
            }
            syncUI();
        }
        wrap.addEventListener('click', function (e) {
            if (e.target.classList.contains('viral-advanced-thumb')) return;
            var rect = wrap.getBoundingClientRect();
            var pct = (e.clientX - rect.left) / rect.width;
            var l = valueToPct(parseFloat(lowInput.value, 10));
            var h = valueToPct(parseFloat(highInput.value, 10));
            var mid = (l + h) / 2;
            setThumbFromClientX(pct <= mid, e.clientX);
        });
        thumbLow.addEventListener('mousedown', function (e) { e.preventDefault(); e.stopPropagation(); startDrag(thumbLow, true, e.clientX); });
        thumbLow.addEventListener('touchstart', function (e) { e.preventDefault(); startDrag(thumbLow, true, e.touches[0].clientX); }, { passive: false });
        thumbHigh.addEventListener('mousedown', function (e) { e.preventDefault(); e.stopPropagation(); startDrag(thumbHigh, false, e.clientX); });
        thumbHigh.addEventListener('touchstart', function (e) { e.preventDefault(); startDrag(thumbHigh, false, e.touches[0].clientX); }, { passive: false });
        lowInput.addEventListener('input', syncUI);
        highInput.addEventListener('input', syncUI);
        if (minIn && minIn.tagName === 'SELECT') minIn.addEventListener('change', function () { lowInput.value = minIn.value; syncUI(); });
        if (maxIn && maxIn.tagName === 'SELECT') maxIn.addEventListener('change', function () { highInput.value = maxIn.value; syncUI(); });
        if (minIn && minIn.tagName === 'INPUT') minIn.addEventListener('change', function () {
            var v = parseCountStr(minIn.value);
            if (v != null) { lowInput.value = isLog && toLog ? toLog(v) : v; syncUI(); }
        });
        if (maxIn && maxIn.tagName === 'INPUT') maxIn.addEventListener('change', function () {
            var v = parseCountStr(maxIn.value);
            if (v != null) { highInput.value = isLog && toLog ? toLog(v) : v; syncUI(); }
        });
        syncUI();
    }

    function initViralAdvancedSliders(overlay) {
        if (!overlay) return;
        var viewRangeWrap = overlay.querySelector('.viral-advanced-range-wrap.viral-advanced-range-views');
        if (viewRangeWrap) {
            var logMin = 0, logMax = 9;
            var toLog = function (n) { return n <= 0 ? 0 : Math.log10(Math.max(1, n)); };
            var fromLog = function (l) { if (l <= 0) return 0; return Math.pow(10, Math.max(0, Math.min(9, l))); };
            var low = viewRangeWrap.querySelector('.viral-advanced-range-low');
            var high = viewRangeWrap.querySelector('.viral-advanced-range-high');
            if (low && high) {
                initDualRangeDrag(viewRangeWrap, low, high, 0, 9, true, toLog, fromLog);
            }
        }
        overlay.querySelectorAll('.viral-advanced-range-wrap:not(.viral-advanced-range-views)').forEach(function (wrap) {
            var low = wrap.querySelector('.viral-advanced-range-low');
            var high = wrap.querySelector('.viral-advanced-range-high');
            var minVal = parseFloat(wrap.getAttribute('data-min-val'), 10) || 0;
            var maxVal = parseFloat(wrap.getAttribute('data-max-val'), 10) || 100;
            if (low && high) initDualRangeDrag(wrap, low, high, minVal, maxVal, false, null, null);
        });
    }

    function updateRangeFill(wrap, lowPct, highPct) {
        if (!wrap) return;
        var pctLow = Math.min(lowPct, highPct) * 100;
        var pctHigh = Math.max(lowPct, highPct) * 100;
        wrap.style.setProperty('--range-low', pctLow + '%');
        wrap.style.setProperty('--range-high', pctHigh + '%');
    }

    // Similar Channels view: two mode buttons + search bar + channel results
    function showSimilarChannelsView(container) {
        var phoneIcon = '<svg class="similar-mode-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>';
        var cameraIcon = '<svg class="similar-mode-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 10.48V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4.48l4 3.98v-11l-4 3.98zm-2 5.52H4V6h12v10z"/></svg>';
        var searchIcon = '<svg class="similar-search-input-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';
        container.innerHTML =
            '<div class="similar-view">' +
            '  <div class="similar-header-row">' +
            '    <div class="similar-header-left">' +
            '      <h1 class="similar-title">Similar Channels Finder</h1>' +
            '      <p class="similar-subtitle">Discover channels similar to any YouTube channel using AI-powered content analysis</p>' +
            '    </div>' +
            '    <span class="similar-disclaimer">AI can sometimes make mistakes</span>' +
            '  </div>' +
            '  <div class="similar-mode-btns" role="group" aria-label="Channel type">' +
            '    <button type="button" class="similar-mode-btn active" id="similar-shorts-btn" data-mode="shorts">' + phoneIcon + 'Similar Shorts Channels</button>' +
            '    <button type="button" class="similar-mode-btn" id="similar-longform-btn" data-mode="longform">' + cameraIcon + 'Similar Longform Channels</button>' +
            '  </div>' +
            '  <p class="similar-hint" id="similar-hint">Find channels with similar short-form content and viral patterns</p>' +
            '  <form class="similar-search-form" id="similar-search-form">' +
            '    <div class="similar-search-wrap">' +
            '      <span class="similar-input-icon-wrap">' + searchIcon + '</span>' +
            '      <input type="text" class="similar-search-input" id="similar-search-input" placeholder="Enter channel name, URL, or ID (e.g., MrBeast, UCbRP3c757IWg9M-U7TyEkXA)" autocomplete="off" required>' +
            '      <button type="submit" class="similar-search-btn" id="similar-search-btn">' + searchIcon + 'Find Similar Channels</button>' +
            '    </div>' +
            '  </form>' +
            '  <div class="similar-results" id="similar-results"></div>' +
            '</div>';
        var shortsBtn = document.getElementById('similar-shorts-btn');
        var longformBtn = document.getElementById('similar-longform-btn');
        var hintEl = document.getElementById('similar-hint');
        var form = document.getElementById('similar-search-form');
        var resultsEl = document.getElementById('similar-results');
        var currentMode = 'shorts';
        var lastSearchRaw = '';

        var hints = {
            shorts: 'Find channels with similar short-form content and viral patterns',
            longform: 'Find channels with similar long-form content and audience'
        };

        function setMode(mode) {
            currentMode = mode;
            if (shortsBtn) shortsBtn.classList.toggle('active', mode === 'shorts');
            if (longformBtn) longformBtn.classList.toggle('active', mode === 'longform');
            if (hintEl) hintEl.textContent = hints[mode] || hints.shorts;
            if (lastSearchRaw) {
                var query = resolveChannelQuery(lastSearchRaw);
                searchYouTubeChannels(query, currentMode, resultsEl);
            }
        }

        if (shortsBtn) {
            shortsBtn.addEventListener('click', function () {
                setMode('shorts');
            });
        }
        if (longformBtn) {
            longformBtn.addEventListener('click', function () {
                setMode('longform');
            });
        }
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var input = document.getElementById('similar-search-input');
                var raw = (input && input.value) ? input.value.trim() : '';
                if (!raw) return;
                lastSearchRaw = raw;
                recordViralzapsSearch(raw);
                var query = resolveChannelQuery(raw);
                searchYouTubeChannels(query, currentMode, resultsEl);
            });
        }
    }

    function resolveChannelQuery(raw) {
        var channelIdMatch = raw.match(/(?:youtube\.com\/channel\/|youtube\.com\/c\/|youtube\.com\/@|^)(UC[\w-]{22})/i);
        if (channelIdMatch) return channelIdMatch[1];
        var handleMatch = raw.match(/youtube\.com\/@([\w.-]+)/i);
        if (handleMatch) return handleMatch[1];
        return raw;
    }

    function isChannelId(query) {
        return /^UC[\w-]{22}$/i.test(query);
    }

    function getChannelSearchSeed(query) {
        if (!query || typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY) return Promise.resolve(query);
        if (!isChannelId(query)) return Promise.resolve(query);
        var url = 'https://www.googleapis.com/youtube/v3/channels?part=snippet&id=' +
            encodeURIComponent(query) + '&key=' + encodeURIComponent(YOUTUBE_API_KEY);
        return fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var items = (data.items || []);
                if (items.length > 0 && items[0].snippet && items[0].snippet.title) {
                    return items[0].snippet.title;
                }
                return query;
            })
            .catch(function () { return query; });
    }

    function searchYouTubeChannels(query, mode, resultsEl) {
        if (!resultsEl) return;
        if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
            resultsEl.innerHTML = '<p class="similar-message similar-error">Could not load YouTube data. Refresh the page or try again in a moment.</p>';
            return;
        }
        resultsEl.innerHTML = '<p class="similar-message similar-loading">' + (mode === 'shorts' ? 'Finding shorts channels...' : 'Finding longform channels...') + '</p>';
        getChannelSearchSeed(query).then(function (searchSeed) {
            var videoDuration = mode === 'shorts' ? 'short' : 'long';
            var searchQuery = searchSeed;
            var url = 'https://www.googleapis.com/youtube/v3/search?' +
                'part=snippet&type=video&videoDuration=' + encodeURIComponent(videoDuration) +
                '&maxResults=25&key=' + encodeURIComponent(YOUTUBE_API_KEY) + '&q=' + encodeURIComponent(searchQuery);
            return fetch(url);
        }).then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.error) {
                    var msg = data.error.message || 'API error';
                    if (data.error.errors && data.error.errors[0]) {
                        msg = data.error.errors[0].message || msg;
                    }
                    resultsEl.innerHTML = '<p class="similar-message similar-error">' + escapeHtml(msg) + '</p>';
                    return;
                }
                var items = (data.items || []);
                var channelIds = [];
                var seen = {};
                for (var i = 0; i < items.length && channelIds.length < 12; i++) {
                    var cid = items[i].snippet && items[i].snippet.channelId ? items[i].snippet.channelId : '';
                    if (cid && !seen[cid]) {
                        seen[cid] = true;
                        channelIds.push(cid);
                    }
                }
                if (channelIds.length === 0) {
                    resultsEl.innerHTML = '<p class="similar-message">No ' + (mode === 'shorts' ? 'shorts' : 'longform') + ' channels found. Try a different search.</p>';
                    return;
                }
                var channelsUrl = 'https://www.googleapis.com/youtube/v3/channels?part=snippet&id=' +
                    channelIds.join(',') + '&key=' + encodeURIComponent(YOUTUBE_API_KEY);
                return fetch(channelsUrl).then(function (res) { return res.json(); }).then(function (chanData) {
                    var channels = (chanData.items || []);
                    var html = '<div class="similar-grid">';
                    var allLinks = [];
                    channels.forEach(function (item) {
                        var id = item.id || '';
                        var snip = item.snippet || {};
                        var title = snip.title || 'Untitled Channel';
                        var desc = (snip.description || '').substring(0, 100);
                        if (snip.description && snip.description.length > 100) desc += '…';
                        var thumb = (snip.thumbnails && snip.thumbnails.medium) ? snip.thumbnails.medium.url : (snip.thumbnails && snip.thumbnails.default ? snip.thumbnails.default.url : '');
                        var link = id ? 'https://www.youtube.com/channel/' + id : '#';
                        if (link !== '#') allLinks.push(link);
                        html += '<a class="similar-card" href="' + link + '" target="_blank" rel="noopener noreferrer">' +
                            '<div class="similar-card-thumb"><img src="' + escapeHtml(thumb) + '" alt="" loading="lazy"></div>' +
                            '<div class="similar-card-body">' +
                            '<h3 class="similar-card-title">' + escapeHtml(title) + '</h3>' +
                            (desc ? '<p class="similar-card-desc">' + escapeHtml(desc) + '</p>' : '') +
                            '</div></a>';
                    });
                    html += '</div>';
                    if (allLinks.length > 0) {
                        html += '<div class="similar-all-links">';
                        html += '<h4 class="similar-all-links-title">All similar channel links</h4>';
                        html += '<div class="similar-all-links-list">';
                        allLinks.forEach(function (url) {
                            html += '<a class="similar-link-item" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(url) + '</a>';
                        });
                        html += '</div>';
                        var linksPayload = allLinks.join('\n');
html += '<button type="button" class="similar-copy-links-btn" data-links="' + escapeHtml(linksPayload.replace(/\n/g, '\\n')) + '">Copy all links</button>';
                        html += '</div>';
                    }
                    resultsEl.innerHTML = html;
                    var copyBtn = resultsEl.querySelector('.similar-copy-links-btn');
                    if (copyBtn) {
                        copyBtn.addEventListener('click', function () {
                            var links = (this.getAttribute('data-links') || '').replace(/\\n/g, '\n').replace(/&amp;/g, '&');
                            if (!links) return;
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                navigator.clipboard.writeText(links).then(function () {
                                    copyBtn.textContent = 'Copied!';
                                    setTimeout(function () { copyBtn.textContent = 'Copy all links'; }, 2000);
                                }).catch(function () {
                                    fallbackCopy(links, copyBtn);
                                });
                            } else {
                                fallbackCopy(links, copyBtn);
                            }
                        });
                    }
                    function fallbackCopy(text, btn) {
                        var ta = document.createElement('textarea');
                        ta.value = text;
                        ta.style.position = 'fixed';
                        ta.style.opacity = '0';
                        document.body.appendChild(ta);
                        ta.select();
                        try {
                            document.execCommand('copy');
                            btn.textContent = 'Copied!';
                            setTimeout(function () { btn.textContent = 'Copy all links'; }, 2000);
                        } catch (e) {}
                        document.body.removeChild(ta);
                    }
                });
            })
            .catch(function (err) {
                resultsEl.innerHTML = '<p class="similar-message similar-error">Network error. Check your connection and try again.</p>';
            });
    }

    function searchYouTubeViral(query, resultsEl, opts) {
        if (!resultsEl) return;
        opts = opts || {};
        var order = opts.order === 'date' ? 'date' : 'viewCount';
        var videoDuration = opts.videoDuration === 'short' ? 'short' : (opts.videoDuration === 'long' ? 'long' : '');
        if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
            resultsEl.innerHTML = '<p class="viral-message viral-error">Could not load YouTube data. Refresh the page or try again in a moment.</p>';
            return;
        }
        var advancedFilters = opts.advancedFilters || null;
        resultsEl.innerHTML = '<p class="viral-message viral-loading">' + (advancedFilters ? 'Loading viral videos and applying filters...' : 'Loading viral videos...') + '</p>';
        var maxResults = advancedFilters ? 50 : 12;
        var url = 'https://www.googleapis.com/youtube/v3/search?' +
            'part=snippet&type=video&order=' + encodeURIComponent(order) + '&maxResults=' + maxResults + '&key=' +
            encodeURIComponent(YOUTUBE_API_KEY) + '&q=' + encodeURIComponent(query);
        if (videoDuration) {
            url += '&videoDuration=' + encodeURIComponent(videoDuration);
        }
        fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.error) {
                    var msg = data.error.message || 'API error';
                    if (data.error.errors && data.error.errors[0]) {
                        msg = data.error.errors[0].message || msg;
                    }
                    resultsEl.innerHTML = '<p class="viral-message viral-error">' + escapeHtml(msg) + '</p>';
                    return;
                }
                var items = (data.items || []).slice();
                if (items.length === 0) {
                    resultsEl.innerHTML = '<p class="viral-message">No viral videos found. Try a different search.</p>';
                    return;
                }
                var ids = items.map(function (item) {
                    return item.id && item.id.videoId ? item.id.videoId : '';
                }).filter(Boolean);
                var channelIds = items.map(function (item) {
                    return (item.snippet && item.snippet.channelId) ? item.snippet.channelId : '';
                }).filter(Boolean);
                var statsPromise = fetchVideoStatistics(ids);
                var channelPromise = advancedFilters ? fetchChannelStatistics(channelIds) : Promise.resolve({});
                Promise.all([statsPromise, channelPromise]).then(function (results) {
                    var statsMap = results[0];
                    var channelMap = results[1];
                    if (advancedFilters) {
                        var now = Date.now();
                        var weekMs = 7 * 24 * 60 * 60 * 1000;
                        items = items.filter(function (item) {
                            var id = item.id && item.id.videoId ? item.id.videoId : '';
                            var snip = item.snippet || {};
                            var channelId = snip.channelId || '';
                            var stats = statsMap[id] || {};
                            var viewCount = stats.viewCount !== undefined ? stats.viewCount : 0;
                            if (viewCount < advancedFilters.viewCountMin || viewCount > advancedFilters.viewCountMax) return false;
                            var publishedAt = snip.publishedAt;
                            if (publishedAt && (advancedFilters.uploadWeeksMin > 0 || advancedFilters.uploadWeeksMax < 52)) {
                                var weeksAgo = (now - new Date(publishedAt).getTime()) / weekMs;
                                if (weeksAgo < advancedFilters.uploadWeeksMin || weeksAgo > advancedFilters.uploadWeeksMax) return false;
                            }
                            if (channelId && channelMap[channelId]) {
                                var subCount = channelMap[channelId].subscriberCount || 0;
                                var vidCount = channelMap[channelId].videoCount || 0;
                                if (subCount < advancedFilters.subscriberCountMin || subCount > advancedFilters.subscriberCountMax) return false;
                                if (vidCount < advancedFilters.channelUploadMin || vidCount > advancedFilters.channelUploadMax) return false;
                            }
                            return true;
                        });
                    }
                    var filterCaption = advancedFilters && items.length > 0 ? '<p class="viral-message viral-filters-caption">Showing ' + items.length + ' video' + (items.length === 1 ? '' : 's') + ' matching your filters.</p>' : '';
                    var html = filterCaption + '<div class="viral-grid viral-discovery-grid">';
                    items.forEach(function (item) {
                        var id = item.id && item.id.videoId ? item.id.videoId : '';
                        var snip = item.snippet || {};
                        var title = snip.title || 'Untitled';
                        var channel = snip.channelTitle || '';
                        var thumb = (snip.thumbnails && snip.thumbnails.medium) ? snip.thumbnails.medium.url : (snip.thumbnails && snip.thumbnails.default ? snip.thumbnails.default.url : '');
                        var link = id ? 'https://www.youtube.com/watch?v=' + id : '#';
                        var stats = statsMap[id] || {};
                        var viewCount = stats.viewCount !== undefined ? stats.viewCount : 0;
                        var viewsStr = viewCount ? formatCount(viewCount) + ' views' : '';
                        // var viewsBadge = viewCount ? '<span class="viral-card-badge">' + escapeHtml(formatCount(viewCount)) + ' views</span>' : '';
                        html += '<a class="viral-card viral-discovery-card" href="' + link + '" target="_blank" rel="noopener noreferrer">' +
                            '<div class="viral-card-thumb">' +
                            // (viewsBadge ? '<span class="viral-card-badge-wrap">' + viewsBadge + '</span>' : '') +
                            '<img src="' + escapeHtml(thumb) + '" alt="" loading="lazy"></div>' +
                            '<div class="viral-card-body">' +
                            '<h3 class="viral-card-title">' + escapeHtml(title) + '</h3>' +
                            '<p class="viral-card-channel">' + escapeHtml(channel) + '</p>' +
                            (viewsStr ? '<p class="viral-card-views">' + escapeHtml(viewsStr) + '</p>' : '') +
                            '</div></a>';
                    });
                    html += '</div>';
                    if (items.length === 0) {
                        resultsEl.innerHTML = '<p class="viral-message">No videos match the advanced filters. Try loosening the criteria or a different search.</p>';
                    } else {
                        resultsEl.innerHTML = html;
                    }
                });
            })
            .catch(function (err) {
                resultsEl.innerHTML = '<p class="viral-message viral-error">Network error. Check your connection and try again.</p>';
            });
    }

    function searchYouTubeLongform(query, resultsEl) {
        if (!resultsEl) return;
        if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
            resultsEl.innerHTML = '<p class="longform-message longform-error">Could not load YouTube data. Refresh the page or try again in a moment.</p>';
            return;
        }
        resultsEl.innerHTML = '<p class="longform-message longform-loading">Searching...</p>';
        var url = 'https://www.googleapis.com/youtube/v3/search?' +
            'part=snippet&type=video&videoDuration=long&maxResults=12&key=' +
            encodeURIComponent(YOUTUBE_API_KEY) + '&q=' + encodeURIComponent(query);
        fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.error) {
                    var msg = data.error.message || 'API error';
                    if (data.error.errors && data.error.errors[0]) {
                        msg = data.error.errors[0].message || msg;
                    }
                    resultsEl.innerHTML = '<p class="longform-message longform-error">' + escapeHtml(msg) + '</p>';
                    return;
                }
                var items = (data.items || []);
                if (items.length === 0) {
                    resultsEl.innerHTML = '<p class="longform-message">No long-form videos found. Try a different search.</p>';
                    return;
                }
                var ids = items.map(function (item) {
                    return item.id && item.id.videoId ? item.id.videoId : '';
                }).filter(Boolean);
                fetchVideoStatistics(ids).then(function (statsMap) {
                    lastChannelList = [];
                    lastVideoList = items.map(function (item) {
                        var id = item.id && item.id.videoId ? item.id.videoId : '';
                        var snip = item.snippet || {};
                        return {
                            item: item,
                            channelId: snip.channelId || '',
                            viewCount: (statsMap[id] || {}).viewCount !== undefined ? (statsMap[id] || {}).viewCount : 0,
                            publishedAt: snip.publishedAt || ''
                        };
                    });
                    lastResultsEl = resultsEl;
                    lastVideoResultsType = 'longform';
                    var html = '<div class="longform-grid">';
                    lastVideoList.forEach(function (entry) {
                        var item = entry.item;
                        var id = item.id && item.id.videoId ? item.id.videoId : '';
                        var snip = item.snippet || {};
                        var title = snip.title || 'Untitled';
                        var channel = snip.channelTitle || '';
                        var thumb = (snip.thumbnails && snip.thumbnails.medium) ? snip.thumbnails.medium.url : (snip.thumbnails && snip.thumbnails.default ? snip.thumbnails.default.url : '');
                        var link = id ? 'https://www.youtube.com/watch?v=' + id : '#';
                        var viewsStr = entry.viewCount !== undefined && entry.viewCount > 0 ? formatCount(entry.viewCount) + ' views' : '';
                        html += '<a class="longform-card" href="' + link + '" target="_blank" rel="noopener noreferrer">' +
                            '<div class="longform-card-thumb"><img src="' + escapeHtml(thumb) + '" alt="" loading="lazy"></div>' +
                            '<div class="longform-card-body">' +
                            '<h3 class="longform-card-title">' + escapeHtml(title) + '</h3>' +
                            '<p class="longform-card-channel">' + escapeHtml(channel) + '</p>' +
                            (viewsStr ? '<p class="longform-card-views">' + escapeHtml(viewsStr) + '</p>' : '') +
                            '</div></a>';
                    });
                    html += '</div>';
                    resultsEl.innerHTML = html;
                });
            })
            .catch(function (err) {
                resultsEl.innerHTML = '<p class="longform-message longform-error">Network error. Check your connection and try again.</p>';
            });
    }

    /** Alternate short + long results for Home "All" tab (unfiltered search skews heavily to Shorts). */
    function interleaveHomeShortAndLong(shortItems, longItems, maxLen) {
        maxLen = maxLen || 12;
        var seen = {};
        var out = [];
        var i = 0;
        var j = 0;
        while (out.length < maxLen && (i < shortItems.length || j < longItems.length)) {
            if (i < shortItems.length) {
                var s = shortItems[i++];
                var sid = s.id && s.id.videoId;
                if (sid && !seen[sid]) {
                    seen[sid] = true;
                    out.push(s);
                }
            }
            if (out.length >= maxLen) break;
            if (j < longItems.length) {
                var l = longItems[j++];
                var lid = l.id && l.id.videoId;
                if (lid && !seen[lid]) {
                    seen[lid] = true;
                    out.push(l);
                }
            }
        }
        return out;
    }

    function renderHomeVideoGrid(items, resultsEl) {
        var ids = items.map(function (item) {
            return item.id && item.id.videoId ? item.id.videoId : '';
        }).filter(Boolean);
        fetchVideoStatistics(ids).then(function (statsMap) {
            var html = '<div class="home-grid">';
            items.forEach(function (item) {
                var id = item.id && item.id.videoId ? item.id.videoId : '';
                var snip = item.snippet || {};
                var title = snip.title || 'Untitled';
                var channel = snip.channelTitle || '';
                var thumb = (snip.thumbnails && snip.thumbnails.medium) ? snip.thumbnails.medium.url : (snip.thumbnails && snip.thumbnails.default ? snip.thumbnails.default.url : '');
                var link = id ? 'https://www.youtube.com/watch?v=' + id : '#';
                var stats = statsMap[id] || {};
                var viewsStr = stats.viewCount !== undefined ? formatCount(stats.viewCount) + ' views' : '';
                html += '<a class="home-card" href="' + link + '" target="_blank" rel="noopener noreferrer">' +
                    '<div class="home-card-thumb"><img src="' + escapeHtml(thumb) + '" alt="" loading="lazy"></div>' +
                    '<div class="home-card-body">' +
                    '<h3 class="home-card-title">' + escapeHtml(title) + '</h3>' +
                    '<p class="home-card-channel">' + escapeHtml(channel) + '</p>' +
                    (viewsStr ? '<p class="home-card-views">' + escapeHtml(viewsStr) + '</p>' : '') +
                    '</div></a>';
            });
            html += '</div>';
            resultsEl.innerHTML = html;
        });
    }

    function searchYouTubeHome(query, resultsEl, opts) {
        if (!resultsEl) return;
        opts = opts || {};
        var categoryId = opts.categoryId || 'all';
        if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
            resultsEl.innerHTML = '<p class="home-message home-error">Could not load YouTube data. Refresh the page or try again in a moment.</p>';
            return;
        }
        resultsEl.innerHTML = '<p class="home-message home-loading">Loading videos...</p>';
        var key = encodeURIComponent(YOUTUBE_API_KEY);
        var qEnc = encodeURIComponent(query);

        function homeSearchUrl(extra) {
            return 'https://www.googleapis.com/youtube/v3/search?' +
                'part=snippet&type=video&maxResults=6&key=' + key + '&q=' + qEnc + (extra ? '&' + extra : '');
        }

        if (categoryId === 'all') {
            Promise.all([
                fetch(homeSearchUrl('videoDuration=short')).then(function (res) { return res.json(); }),
                fetch(homeSearchUrl('videoDuration=long')).then(function (res) { return res.json(); })
            ])
                .then(function (pair) {
                    var d0 = pair[0];
                    var d1 = pair[1];
                    var shortItems = (!d0 || d0.error) ? [] : (d0.items || []);
                    var longItems = (!d1 || d1.error) ? [] : (d1.items || []);
                    if (d0 && d0.error && d1 && d1.error) {
                        var msg = d0.error.message || 'API error';
                        if (d0.error.errors && d0.error.errors[0]) {
                            msg = d0.error.errors[0].message || msg;
                        }
                        resultsEl.innerHTML = '<p class="home-message home-error">' + escapeHtml(msg) + '</p>';
                        return;
                    }
                    var items = interleaveHomeShortAndLong(shortItems, longItems, 12);
                    if (items.length === 0) {
                        resultsEl.innerHTML = '<p class="home-message">No videos found. Try another category.</p>';
                        return;
                    }
                    renderHomeVideoGrid(items, resultsEl);
                })
                .catch(function () {
                    resultsEl.innerHTML = '<p class="home-message home-error">Network error. Check your connection and try again.</p>';
                });
            return;
        }

        var url = 'https://www.googleapis.com/youtube/v3/search?' +
            'part=snippet&type=video&maxResults=12&key=' + key + '&q=' + qEnc;
        fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.error) {
                    var msg = data.error.message || 'API error';
                    if (data.error.errors && data.error.errors[0]) {
                        msg = data.error.errors[0].message || msg;
                    }
                    resultsEl.innerHTML = '<p class="home-message home-error">' + escapeHtml(msg) + '</p>';
                    return;
                }
                var items = (data.items || []);
                if (items.length === 0) {
                    resultsEl.innerHTML = '<p class="home-message">No videos found. Try another category.</p>';
                    return;
                }
                renderHomeVideoGrid(items, resultsEl);
            })
            .catch(function (err) {
                resultsEl.innerHTML = '<p class="home-message home-error">Network error. Check your connection and try again.</p>';
            });
    }

    function searchYouTubeShorts(query, resultsEl) {
        if (!resultsEl) return;
        if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
            resultsEl.innerHTML = '<p class="shorts-message shorts-error">Could not load YouTube data. Refresh the page or try again in a moment.</p>';
            return;
        }
        resultsEl.innerHTML = '<p class="shorts-message shorts-loading">Searching...</p>';
        var url = 'https://www.googleapis.com/youtube/v3/search?' +
            'part=snippet&type=video&videoDuration=short&maxResults=12&key=' +
            encodeURIComponent(YOUTUBE_API_KEY) + '&q=' + encodeURIComponent(query);
        fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.error) {
                    var msg = data.error.message || 'API error';
                    if (data.error.errors && data.error.errors[0]) {
                        msg = data.error.errors[0].message || msg;
                    }
                    resultsEl.innerHTML = '<p class="shorts-message shorts-error">' + escapeHtml(msg) + '</p>';
                    return;
                }
                var items = (data.items || []);
                if (items.length === 0) {
                    resultsEl.innerHTML = '<p class="shorts-message">No short videos found. Try a different search.</p>';
                    return;
                }
                var ids = items.map(function (item) {
                    return item.id && item.id.videoId ? item.id.videoId : '';
                }).filter(Boolean);
                fetchVideoStatistics(ids).then(function (statsMap) {
                    lastChannelList = [];
                    lastVideoList = items.map(function (item) {
                        var id = item.id && item.id.videoId ? item.id.videoId : '';
                        var snip = item.snippet || {};
                        return {
                            item: item,
                            channelId: snip.channelId || '',
                            viewCount: (statsMap[id] || {}).viewCount !== undefined ? (statsMap[id] || {}).viewCount : 0,
                            publishedAt: snip.publishedAt || ''
                        };
                    });
                    lastResultsEl = resultsEl;
                    lastVideoResultsType = 'shorts';
                    var html = '<div class="shorts-grid">';
                    lastVideoList.forEach(function (entry) {
                        var item = entry.item;
                        var id = item.id && item.id.videoId ? item.id.videoId : '';
                        var snip = item.snippet || {};
                        var title = snip.title || 'Untitled';
                        var channel = snip.channelTitle || '';
                        var thumb = (snip.thumbnails && snip.thumbnails.medium) ? snip.thumbnails.medium.url : (snip.thumbnails && snip.thumbnails.default ? snip.thumbnails.default.url : '');
                        var link = id ? 'https://www.youtube.com/watch?v=' + id : '#';
                        var viewsStr = entry.viewCount !== undefined && entry.viewCount > 0 ? formatCount(entry.viewCount) + ' views' : '';
                        html += '<a class="shorts-card" href="' + link + '" target="_blank" rel="noopener noreferrer">' +
                            '<div class="shorts-card-thumb"><img src="' + escapeHtml(thumb) + '" alt="" loading="lazy"></div>' +
                            '<div class="shorts-card-body">' +
                            '<h3 class="shorts-card-title">' + escapeHtml(title) + '</h3>' +
                            '<p class="shorts-card-channel">' + escapeHtml(channel) + '</p>' +
                            (viewsStr ? '<p class="shorts-card-views">' + escapeHtml(viewsStr) + '</p>' : '') +
                            '</div></a>';
                    });
                    html += '</div>';
                    resultsEl.innerHTML = html;
                });
            })
            .catch(function (err) {
                resultsEl.innerHTML = '<p class="shorts-message shorts-error">Network error. Check your connection and try again.</p>';
            });
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Picked by Viralzaps: curated video IDs (hand-picked)
    var PICKED_BY_VIRALZAPS_VIDEO_IDS = [
        'dQw4w9WgXcQ',
        '9bZkp7q19f0',
        'kJQP7kiw5Fk',
        'RgKAFK5djSk',
        'OPf0YbXqDm0',
        '09R8_2nJtjg',
        'YQHsXMglC9A',
        'jNQXAC9IVRw'
    ];

    function renderPickedByViralzapsView(resultsEl) {
        if (!resultsEl) return;
        if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
            resultsEl.innerHTML = '<p class="viral-message viral-error">Could not load this section. Refresh the page or try again.</p>';
            return;
        }
        resultsEl.innerHTML = '<p class="viral-message viral-loading">Loading Picked by Viralzaps...</p>';
        var url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=' +
            PICKED_BY_VIRALZAPS_VIDEO_IDS.join(',') + '&key=' + encodeURIComponent(YOUTUBE_API_KEY);
        fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.error) {
                    var msg = data.error.message || 'API error';
                    if (data.error.errors && data.error.errors[0]) msg = data.error.errors[0].message || msg;
                    resultsEl.innerHTML = '<p class="viral-message viral-error">' + escapeHtml(msg) + '</p>';
                    return;
                }
                var items = data.items || [];
                if (items.length === 0) {
                    resultsEl.innerHTML = '<p class="viral-message">No picked videos to show.</p>';
                    return;
                }
                var html = '<p class="picked-by-viralzaps-intro">Hand-picked by Viralzaps</p><div class="viral-grid">';
                items.forEach(function (item) {
                    var id = item.id;
                    var snip = item.snippet || {};
                    var stats = item.statistics || {};
                    var title = snip.title || 'Untitled';
                    var channel = snip.channelTitle || '';
                    var thumb = (snip.thumbnails && snip.thumbnails.medium) ? snip.thumbnails.medium.url : (snip.thumbnails && snip.thumbnails.default ? snip.thumbnails.default.url : '');
                    var viewCount = parseInt(stats.viewCount, 10) || 0;
                    var viewsStr = formatCount(viewCount) + ' views';
                    var link = 'https://www.youtube.com/watch?v=' + id;
                    html += '<a class="viral-card" href="' + link + '" target="_blank" rel="noopener noreferrer">' +
                        '<div class="viral-card-thumb"><img src="' + escapeHtml(thumb) + '" alt="" loading="lazy"></div>' +
                        '<div class="viral-card-body">' +
                        '<h3 class="viral-card-title">' + escapeHtml(title) + '</h3>' +
                        '<p class="viral-card-channel">' + escapeHtml(channel) + '</p>' +
                        '<p class="viral-card-views">' + escapeHtml(viewsStr) + '</p>' +
                        '</div></a>';
                });
                html += '</div>';
                resultsEl.innerHTML = html;
            })
            .catch(function (err) {
                resultsEl.innerHTML = '<p class="viral-message viral-error">Failed to load Picked by Viralzaps. Check your connection and API key.</p>';
            });
    }

    // Fetch likeCount (and viewCount) for video IDs via YouTube Videos API
    function fetchVideoStatistics(videoIds) {
        if (!videoIds.length || typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
            return Promise.resolve({});
        }
        var url = 'https://www.googleapis.com/youtube/v3/videos?part=statistics&id=' +
            videoIds.join(',') + '&key=' + encodeURIComponent(YOUTUBE_API_KEY);
        return fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var map = {};
                if (data.error || !data.items) return map;
                data.items.forEach(function (item) {
                    var id = item.id;
                    var stats = item.statistics || {};
                    map[id] = {
                        likeCount: parseInt(stats.likeCount, 10) || 0,
                        viewCount: parseInt(stats.viewCount, 10) || 0
                    };
                });
                return map;
            })
            .catch(function () { return {}; });
    }

    function fetchChannelStatistics(channelIds) {
        if (!channelIds.length || typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
            return Promise.resolve({});
        }
        var unique = channelIds.filter(function (id, i, arr) { return id && arr.indexOf(id) === i; });
        var url = 'https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=' +
            unique.join(',') + '&key=' + encodeURIComponent(YOUTUBE_API_KEY);
        return fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var map = {};
                if (data.error || !data.items) return map;
                data.items.forEach(function (item) {
                    var id = item.id;
                    var stats = item.statistics || {};
                    var snip = item.snippet || {};
                    map[id] = {
                        subscriberCount: parseInt(stats.subscriberCount, 10) || 0,
                        videoCount: parseInt(stats.videoCount, 10) || 0,
                        viewCount: parseInt(stats.viewCount, 10) || 0,
                        publishedAt: snip.publishedAt || ''
                    };
                });
                return map;
            })
            .catch(function () { return {}; });
    }

    function formatCount(n) {
        if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
        if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
        return String(n);
    }

    function formatCountDecimal(n) {
        if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
        if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(2).replace(/\.?0+$/, '') + 'K';
        return String(n);
    }

    function startedAgo(publishedAt) {
        if (!publishedAt) return '';
        var d = new Date(publishedAt);
        var now = new Date();
        var diffDays = Math.floor((now - d) / (24 * 60 * 60 * 1000));
        if (diffDays <= 0) return 'Started today';
        if (diffDays === 1) return 'Started 1d ago';
        if (diffDays >= 365) {
            var years = (diffDays / 365).toFixed(1).replace(/\.0$/, '');
            return 'Started ' + years + 'y ago';
        }
        return 'Started ' + diffDays + 'd ago';
    }

    // Trending / High Views Low Uploads / Underrated: fetch and render channel cards with stats + recent videos
    // underratedChannels = potential (high engagement) but not much recognition (smaller subs) – sort by engagement, prefer smaller channels
    function loadChannelsByMode(mode) {
        if (typeof YOUTUBE_API_KEY === 'undefined' || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
            return Promise.reject(new Error('API key required'));
        }
        var key = encodeURIComponent(YOUTUBE_API_KEY);
        var searchQ = 'shorts';
        var maxChannels = 12;
        if (mode === 'trending') {
            searchQ = 'shorts';
            maxChannels = 25;
        } else if (mode === 'highViewsLowUploads') {
            searchQ = 'viral+shorts+channel';
        } else if (mode === 'underratedChannels') {
            searchQ = 'shorts+channel';
            maxChannels = 25;
        } else if (mode === 'recentlyAddedToViralzaps') {
            searchQ = 'shorts+channel';
            maxChannels = 20;
        }
        return fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=' + maxChannels + '&q=' + encodeURIComponent(searchQ) + '&key=' + key)
            .then(function (r) { return r.json(); })
            .then(function (searchData) {
                if (searchData.error || !searchData.items || searchData.items.length === 0) {
                    return [];
                }
                var channelIds = searchData.items.slice(0, maxChannels).map(function (item) {
                    return item.id && item.id.channelId ? item.id.channelId : '';
                }).filter(Boolean);
                if (channelIds.length === 0) return [];
                return fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=' + channelIds.join(',') + '&key=' + key)
                    .then(function (r) { return r.json(); })
                    .then(function (chanData) {
                        var channels = (chanData.items || []).map(function (c) {
                            var snip = c.snippet || {};
                            var stats = c.statistics || {};
                            var content = c.contentDetails || {};
                            var uploads = content.relatedPlaylists && content.relatedPlaylists.uploads ? content.relatedPlaylists.uploads : '';
                            var viewCount = parseInt(stats.viewCount, 10) || 0;
                            var videoCount = parseInt(stats.videoCount, 10) || 1;
                            return {
                                id: c.id,
                                title: snip.title || 'Unknown',
                                thumb: (snip.thumbnails && snip.thumbnails.medium) ? snip.thumbnails.medium.url : (snip.thumbnails && snip.thumbnails.default ? snip.thumbnails.default.url : ''),
                                subscriberCount: parseInt(stats.subscriberCount, 10) || 0,
                                viewCount: viewCount,
                                videoCount: videoCount,
                                avgViews: videoCount > 0 ? Math.round(viewCount / videoCount) : 0,
                                publishedAt: snip.publishedAt || '',
                                uploadsPlaylistId: uploads
                            };
                        });
                        return Promise.all(channels.map(function (ch) {
                            if (!ch.uploadsPlaylistId) return Promise.resolve({ channel: ch, videoIds: [], items: [] });
                            return fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=6&playlistId=' + ch.uploadsPlaylistId + '&key=' + key)
                                .then(function (r) { return r.json(); })
                                .then(function (plData) {
                                    var items = plData.items || [];
                                    var videoIds = items.map(function (i) {
                                        var rid = i.snippet && i.snippet.resourceId ? i.snippet.resourceId.videoId : '';
                                        return rid;
                                    }).filter(Boolean);
                                    return { channel: ch, videoIds: videoIds, items: items };
                                });
                        })).then(function (results) {
                            var allVideoIds = [];
                            results.forEach(function (r) {
                                (r.videoIds || []).forEach(function (id) { allVideoIds.push(id); });
                            });
                            if (allVideoIds.length === 0) return results.map(function (r) { return { channel: r.channel, videoStats: {} }; });
                            return fetch('https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=' + allVideoIds.slice(0, 50).join(',') + '&key=' + key)
                                .then(function (r) { return r.json(); })
                                .then(function (vidData) {
                                    var videoStats = {};
                                    (vidData.items || []).forEach(function (v) {
                                        var views = parseInt((v.statistics || {}).viewCount, 10) || 0;
                                        videoStats[v.id] = { viewCount: views, title: (v.snippet || {}).title || '' };
                                    });
                                    results.forEach(function (r) {
                                        var items = r.items || [];
                                        var latestAt = '';
                                        r.channel.recentVideos = items.map(function (i) {
                                            var vid = i.snippet && i.snippet.resourceId ? i.snippet.resourceId.videoId : '';
                                            var title = (i.snippet && i.snippet.title) ? i.snippet.title : '';
                                            var pubAt = (i.snippet && i.snippet.publishedAt) ? i.snippet.publishedAt : '';
                                            if (pubAt && (!latestAt || pubAt > latestAt)) latestAt = pubAt;
                                            return { id: vid, title: title, viewCount: (videoStats[vid] && videoStats[vid].viewCount) || 0 };
                                        });
                                        r.channel.latestVideoAt = latestAt;
                                    });
                                    if (mode === 'trending') {
                                        results.sort(function (a, b) { return (b.channel.viewCount || 0) - (a.channel.viewCount || 0); });
                                        results = results.slice(0, 12);
                                    } else if (mode === 'highViewsLowUploads') {
                                        results.sort(function (a, b) { return (b.channel.avgViews || 0) - (a.channel.avgViews || 0); });
                                    } else if (mode === 'underratedChannels') {
                                        var MAX_SUBS_UNDERRATED = 1500000;
                                        function viewsPerSub(ch) {
                                            var sub = ch.subscriberCount || 1;
                                            return (ch.viewCount || 0) / sub;
                                        }
                                        function underratedScore(r) {
                                            var ch = r.channel;
                                            var subs = ch.subscriberCount || 0;
                                            var engagement = viewsPerSub(ch);
                                            if (subs <= 0) return engagement;
                                            if (subs > MAX_SUBS_UNDERRATED) return engagement * 0.3;
                                            return engagement * (1 + (1 - subs / MAX_SUBS_UNDERRATED) * 0.7);
                                        }
                                        results.sort(function (a, b) { return underratedScore(b) - underratedScore(a); });
                                        results = results.slice(0, 12);
                                    } else if (mode === 'recentlyAddedToViralzaps') {
                                        results.sort(function (a, b) {
                                            var atA = a.channel.latestVideoAt || '';
                                            var atB = b.channel.latestVideoAt || '';
                                            return atB.localeCompare(atA);
                                        });
                                        results = results.slice(0, 12);
                                    }
                                    return results.map(function (r) { return { channel: r.channel }; });
                                });
                        });
                    });
            });
    }

    function loadTrendingChannels() {
        return loadChannelsByMode('trending');
    }

    function renderChannelsView(resultsEl, mode) {
        if (!resultsEl) return;
        mode = mode || 'trending';
        var loadingText = 'Loading trending channels...';
        if (mode === 'highViewsLowUploads') loadingText = 'Loading high views, low uploads channels...';
        else if (mode === 'underratedChannels') loadingText = 'Loading underrated channels...';
        else if (mode === 'recentlyAddedToViralzaps') loadingText = 'Loading recently added to Viralzaps...';
        var emptyText = 'No trending channels found.';
        if (mode === 'highViewsLowUploads') emptyText = 'No channels found.';
        else if (mode === 'underratedChannels') emptyText = 'No underrated channels found.';
        else if (mode === 'recentlyAddedToViralzaps') emptyText = 'No recently added channels found.';
        resultsEl.innerHTML = '<div class="trending-channels-loading">' + escapeHtml(loadingText) + '</div>';
        loadChannelsByMode(mode)
            .then(function (channels) {
                if (!channels || channels.length === 0) {
                    resultsEl.innerHTML = '<p class="trending-channels-message">' + escapeHtml(emptyText) + '</p>';
                    lastChannelList = [];
                    lastResultsEl = null;
                    return;
                }
                var view = resultsEl.closest('.shorts-view') || resultsEl.closest('.longform-view');
                var sortBy = getSortedByValue(view);
                var sorted = sortChannelsBy(channels, sortBy);
                renderChannelCards(resultsEl, sorted);
            })
            .catch(function (err) {
                resultsEl.innerHTML = '<p class="trending-channels-message trending-channels-error">Failed to load channels. Check your API key and try again.</p>';
            });
    }

    function renderTrendingChannelsView(resultsEl) {
        renderChannelsView(resultsEl, 'trending');
    }

    // Search: filter sidebar items by label text
    if (searchInput && navList) {
        searchInput.addEventListener('input', function () {
            var q = (searchInput.value || '').trim().toLowerCase();
            var items = navList.querySelectorAll('.sidebar-item[data-nav]');
            items.forEach(function (item) {
                var label = item.querySelector('.sidebar-btn-label, .sidebar-btn .sidebar-btn-label');
                var text = (label && label.textContent) ? label.textContent.trim().toLowerCase() : '';
                if (!text) {
                    var btn = item.querySelector('.sidebar-link, .sidebar-btn');
                    text = btn ? btn.textContent.trim().toLowerCase() : '';
                }
                var sublinks = item.querySelectorAll('.sidebar-sublink');
                var subText = Array.from(sublinks).map(function (s) { return s.textContent.trim().toLowerCase(); }).join(' ');
                var match = !q || text.indexOf(q) !== -1 || subText.indexOf(q) !== -1;
                item.classList.toggle('hidden-by-search', !match);
            });
            // If search matches any Channels sublink, expand the dropdown
            if (q && channelsItem && !channelsItem.classList.contains('hidden-by-search') && channelsDropdown) {
                var sublinks = channelsItem.querySelectorAll('.sidebar-sublink');
                var subMatch = Array.from(sublinks).some(function (s) {
                    return s.textContent.trim().toLowerCase().indexOf(q) !== -1;
                });
                if (subMatch) {
                    channelsDropdown.removeAttribute('hidden');
                    if (channelsBtn) {
                        channelsBtn.setAttribute('aria-expanded', 'true');
                        channelsItem.classList.add('open');
                    }
                }
            }
        });
    }

    // Show Home view by default when DOM is ready (replaces "Select an item from the sidebar")
    function initHomeView() {
        var content = document.getElementById('dashboard-content');
        if (content) showPlaceholder('home');
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHomeView);
    } else {
        initHomeView();
    }
})();
