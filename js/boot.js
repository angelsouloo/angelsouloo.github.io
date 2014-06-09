;(function($, win, doc) {
  'use strict';

  var $doc = $(doc),
      spring = {},
      appcache = win.applicationCache

  // appcache
  if(appcache) {
    appcache.addEventListener('updateready', function(e) {
      if(appcache.status === appcache.UPDATEREADY) {
        appcache.swapCache()
        location.reload()
      }
    }, false)
  }

  // default config
  spring.config = {
    // my blog title
    title: '记忆碎片',
    // my blog description
    desc: 'Just A Blog',
    // my github username
    owner: 'angelsouloo',
    // creator's username
    creator: '',
    // the repository name on github for writting issues
    repo: 'angelsouloo.github.io',
    // custom page
    pages: [],
    // github's api
    api: 'https://api.github.com',
    // the custom page size
    per_page: 10
  }

  spring.data = {
    labels: [],
    issues: {}
  }

  spring.fn = {}

  spring.fn.request = function(method, parameters, callback) {
    var url = spring.config.api + method + '?callback=?'

    $.getJSON(url, parameters, function(data) {
      if(!data.meta || !data.data || data.meta.status !== 200) {
        try {
          console.log(data)
        } catch(e) {
        }
      }
      callback.call(spring, data)
    })
  }

  spring.fn.getLabels = function(callback) {
    spring.fn.request('/repos/' + spring.config.owner + '/' + spring.config.repo + '/labels', {}, function(data) {
      spring.data.labels = data.data || []
      callback()
    })
  }
  
  spring.fn.hitokoto = function(d) {
    $("#hitokoto").html('<a href="http://hitokoto.us/view/'+d.id+'.html" target="_blank" title="分类：'+d.catname+'&#10;出自：'+d.source+'&#10;喜欢：'+d.like+'&#10;投稿：'+d.author+' @ '+d.date+'">『'+d.hitokoto+'』</a>');
  }

  spring.fn.getHitokoto = function() {
    var url = 'http://api.hitokoto.us/rand'+ '?callback=?';
    var parameters = {
      encode: 'jsc',
      fun: 'spring.fn.hitokoto'
    };
    $.getJSON(url, parameters, function(data) {
      // console.log(data)
    })
  }

  spring.fn.getDuoshuo = function(d) {
    if($('#duoshuo'+d.id).has("div").length>0){
      $('#duoshuo'+d.id).empty();
      return;
    }
    var el = document.createElement('div');
    el.setAttribute('class', 'ds-thread');
    el.setAttribute('data-title', d.title);
    el.setAttribute('data-thread-key', d.id);
    el.setAttribute('data-url', d.html_url);
    DUOSHUO.EmbedThread(el);
    $('#duoshuo'+d.id).append(el);
  }

  spring.fn.getHash = function(url) {
    url = url || location.href
    return url.replace(/^[^#]*#?\/?(.*)\/?$/, '$1')
  }

  spring.fn.encodeHtml = function(str) {
    return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\x60/g, '&#96;').replace(/\x27/g, '&#39;').replace(/\x22/g, '&quot;')
  }

  spring.fn.getDate = function(time) {
    return (new Date(time) + '').split(' ').slice(1, 4).join(' ')
  }

  marked.setOptions({
    highlight: function(code) {
      return hljs.highlightAuto(code).value
    }
  })

  template.helper('marked', marked)
  template.helper('encodeURIComponent', encodeURIComponent)
  template.helper('$', $)

  var tapEvent = (function() {
    return "createTouch" in document ? 'tap' : 'click'
  })()

  spring.config.tapEvent = tapEvent

  $doc.on('click', 'a.preventlink, a.taplink', function(event) {
    event.preventDefault()
    event.stopPropagation()
  })

  $doc.on(tapEvent, '.taplink', function(event) {
    var $currentTarget = $(event.currentTarget),
        $target = $(event.target),
        hash = $currentTarget.attr('data-href') || $currentTarget.attr('href')

    if($target.closest('.stoptaplink').length)
      return

    $currentTarget.trigger('spa:navigate', {hash: spring.fn.getHash(hash)})
  })

  // to prevent the click through
  if(tapEvent == 'tap') {
    $doc.on('touchstart', 'a', function(event) {
      var $target = $(event.currentTarget)
      $target.data('taptime', +new Date())
    })

    $doc.on('click', 'a', function(event) {
      var $target = $(event.currentTarget),
          taptime = $target.data('taptime')

      if(!taptime || (+new Date() - taptime > 500)) {
        event.preventDefault()
        event.stopPropagation()
      }
    })
  }

  win.spring = $.spring = spring

  $doc.on(tapEvent, '.btn-back', function(event) {
    var $prevPage = $.spa.getViewData($.spa.getCurPage()).prevPage

    if(!$prevPage.hasClass('spa-page-empty')) {
      win.history.back()
    } else {
      $doc.trigger('spa:navigate', {hash: ''})
    }
  })

  $(function() {
    $doc.trigger('spa:boot', {
      callback: function() {
        $doc.trigger('side:create');
        spring.fn.getLabels(function() {
          $doc.trigger('menu:render');
          $doc.trigger('side:render', {
            callback: function() {
              spring.fn.getHitokoto();
            }
          });
        })
      }
    })    
  })

})(Zepto, window, document)