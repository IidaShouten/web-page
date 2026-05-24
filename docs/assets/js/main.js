(function ($) {
    function updateScrollTopButton() {
        if ($(window).scrollTop() > 160) {
            $('.scroll-up').fadeIn(180);
        } else {
            $('.scroll-up').fadeOut(180);
        }
    }

    function updateNavbarState() {
        const $navbar = $('.site-navbar');
        const heroHeight = $('.hero-section').outerHeight() || 0;

        if (!$navbar.length) {
            return;
        }

        if ($(window).scrollTop() > Math.max(40, heroHeight * 0.15)) {
            $navbar.removeClass('navbar-transparent');
        } else {
            $navbar.addClass('navbar-transparent');
        }
    }

    function bindDesktopDropdowns() {
        const isDesktop = $(window).width() > 767;
        const $dropdowns = $('.navbar-custom .navbar-nav > li.dropdown');

        $dropdowns.off('.siteDropdown');

        if (!isDesktop) {
            return;
        }

        $dropdowns.on('mouseenter.siteDropdown', function () {
            $(this).addClass('open');
            $(this).find('.dropdown-toggle').attr('aria-expanded', 'true');
        });

        $dropdowns.on('mouseleave.siteDropdown', function () {
            $(this).removeClass('open');
            $(this).find('.dropdown-toggle').attr('aria-expanded', 'false');
        });
    }

    function bindSmoothScroll() {
        $('.section-scroll, a[href="#totop"]').on('click', function (event) {
            const href = $(this).attr('href');

            if (!href || href.charAt(0) !== '#') {
                return;
            }

            const $target = $(href);

            if (!$target.length) {
                return;
            }

            event.preventDefault();
            $('html, body').stop().animate(
                {
                    scrollTop: $target.offset().top - 50,
                },
                700
            );

            $('.navbar-collapse.in').collapse('hide');
        });
    }

    $(window).on('load', function () {
        $('.loader').fadeOut(150);
        $('.page-loader').delay(250).fadeOut('slow');
    });

    $(function () {
        updateScrollTopButton();
        updateNavbarState();
        bindDesktopDropdowns();
        bindSmoothScroll();

        $(document).on('show.bs.dropdown hide.bs.dropdown', '.dropdown', function (event) {
            $(this)
                .find('.dropdown-toggle')
                .attr('aria-expanded', event.type === 'show');
        });

        $(window).on('error', function (event) {
            window.SiteRuntime.recordClientEvent('window_error', {
                message: event.originalEvent && event.originalEvent.message,
                source: event.originalEvent && event.originalEvent.filename,
            });
        });

        $(window).on('unhandledrejection', function (event) {
            const reason = event.originalEvent ? event.originalEvent.reason : event.reason;
            window.SiteRuntime.recordClientEvent('unhandled_rejection', {
                message: reason && reason.message ? reason.message : String(reason),
            });
        });

        $('img').on('error', function () {
            window.SiteRuntime.recordClientEvent('image_load_failed', {
                src: $(this).attr('src') || '',
                alt: $(this).attr('alt') || '',
            });
        });

        $(window).on('scroll', function () {
            updateScrollTopButton();
            updateNavbarState();
        });

        $(window).on('resize', function () {
            bindDesktopDropdowns();
            updateNavbarState();
        });
    });
})(jQuery);
