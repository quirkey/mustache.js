/*
Shameless port of a shameless port
@defunkt => @janl => @aq

See http://github.com/defunkt/mustache for more info.
*/

;(function($) {
  
  
  function Mustache(template, view, context) {
    if (typeof context == 'undefined') context = {};
    /* 
    Tries to find a partial in the global scope and render it
    */
    function render_partial(name) {
      // FIXME: too hacky
      var evil_name = eval(name)
      switch(typeof evil_name) {
        case "string": // a tring partial, we simply render
        return Mustache(evil_name, "", context);
        case "object": // a view partial needs a `name_template` template to render
        var tpl = name + "_template";
        return Mustache(eval(tpl), evil_name, context);
        default: // should not happen #famouslastwords
        throw("Unknown partial type.");
      }
    };

    /*
    Renders boolean and enumerable sections
    */
    function render_section(template) {
      if(template.indexOf("{{#") == -1) {
        return template;
      }
      // for each {{#foo}}{{/foo}} section do...
      return template.replace(/\{\{\#(.+)\}\}\s*([\s\S]+)\{\{\/\1\}\}\s*/mg,
      function(match, name, content) {
        var value = find(name);
        if($.isArray(value)) { // Enumerable, Let's loop!
        return value.map(function(row) {
          return Mustache(content, row, context);
          }).join('');
          } else if(value) { // boolean section
            return Mustache(content, null, context);
          } else {
            return "";
          }
        }
      );
    };

    /*
    Replace {{foo}} and friends with values from our view
    */
    function render_tags(template) {
      // tit for tat
      // for each {{(!<{)?foo}} tag, do...
      return template.replace(/\{\{(!|<|\{)?([^\/#]+?)\1?\}\}+/mg,
      function (match, operator, name) {
        switch(operator) {
          case "!": // ignore comments
          return match;
          case "<": // render partial
          return render_partial(name);
          case '{': // the triple mustache is unescaped
          return find(name);
          default: // escape the value
          return escape(find(name));
        }
        }, this);
      };

      /*
      find `name` in current `context`. That is find me a value 
      from the view object
      */
      function find(name) {
        name = $.trim(name);
        if(typeof context[name] === "function") {
          return context[name].apply(context);
        }
        if(context[name] !== undefined) {
          return context[name];
        }
        throw("Can't find " + name + " in " + context);
      };

      // Utility methods

      /*
      Does away with nasty characters
      */
      function escape(s) {
        return s.toString().replace(/[&"<>\\]/g, function(s) {
          switch(s) {
            case "&": return "&amp;";
            case "\\": return "\\\\";;
            case '"': return '\"';;
            case "<": return "&lt;";
            case ">": return "&gt;";
            default: return s;
          }
        });
      };

    if(template.indexOf("{{") == -1) {
      return template;
    }

    
    // keep context around for recursive calls
    var original_context = $.extend(context, view);

    // first, render all sections
    var html = render_section(template);
    
    context = original_context;

    // finally, render tags
    return render_tags(html);

  };

  $.mustache = function(template, view) {
    return Mustache(template, view);
  };

})(jQuery);