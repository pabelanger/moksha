// This file is part of Moksha.
// Copyright (C) 2008-2009  Red Hat, Inc.
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

var _extensions = function(){};

_extensions.prototype = {
    _extension_cache: {},
    _extension_deferred: {},
    _extension_uid_counter: 0,
    get_uid: function()
      {
          uid = this._extension_uid_counter +
            "_" + (Math.floor(Math.random() * 10000000));
          this._extension_uid_counter++;

          return uid;
      },
    grep_extensions: function(frag)
      {
        var extension_points = jQuery('moksha_extpoint', frag);
        extension_points.each
          (
            function(i)
              {
                var ep = $(this)
                var data = ep.text();
                //remove the extension point
                ep.replaceWith('');

                data = data.replace(/'/g, "\"");
                data = data.replace(/\n/g, "");
                data = $.secureEvalJSON(data);

                moksha.extensions.load_extensions(data);
              }
          );
      },
    load_ui: function(ui, js)
      {
        id = js.placeholder_id;
        ui = eval("new myfedora.ui." + ui + "('" + id + "')");
        ui.set_show_effect(js.show_effect);
        ui.set_hide_effect(js.hide_effect);
      },
    run_extensions: function (js, data)
      {
        if (!js)
          {
            return;
          }

        var obj_list = js;

        if (data.hide_parent)
          jQuery("#" + data.hide_parent).hide();

        var append_div = jQuery("#" + data.placeholder_id);

        var block_element;
        if (append_div.is('ul') ||
            append_div.is('ol'))
          {
            block_element = jQuery('<li/>')
          }
        else
          {
            block_element = jQuery('<div/>')
          }

        for(var i = 0; i < obj_list.length; i++) {
          //clone our data and generate our uid so we are unique
          var d = new moksha.shallow_clone(data);
          d.uid = "extension_" + this.get_uid();

          //create a place to put this extension that they can call their own
          var div = block_element.attr("id", d.uid);

          append_div.append(div);
          var overlay = jQuery('<div><span class="message"></span></div>');
          div.append(overlay);
          d.overlay = overlay;

          //run the script and parse in the results
          var result = obj_list[i].run(d);
          if (!result)
            {
              return;
            }

          div.append(result);

          if (!data.ui) {
            if (data.show_effect) {
              eval("append_div." + data.show_effect);
            } else {
              div.show();
            }
          }

        }

      },

    load_extensions: function (data)
      {
        var ext_code = this._extension_cache[data.type];
        var ext_deferred = this._extension_deferred[data.type];

        /* prep ui if this extention point is a ui element */
        var use_ui = data.ui;

        if (use_ui)
          {
            this.load_ui(use_ui, data);
          }

        /* run the code if it is in our cache */
        if (ext_code)
          {
            this.run_extensions(ext_code, data);
            return;
          }
        else if (ext_deferred)
          {
            this._extension_deferred[data.type].push(data);
            return;
          }

        this._extension_deferred[data.type] = new Array();
        this._extension_deferred[data.type].push(data);

        // we trust the server so we can just script inject the js
        // it should be a list of objects with a run method and code to execute
        // the modules
        var js_script_tag = jQuery('<script />');

        var attrs ={'type':'text/javascript',
                    'src': 'moksha_extension_point?' + 'exttype=' + data.type
                   };

        js_script_tag.attr(attrs);

        jQuery('head:first').append(js_script_tag);
      }
};

moksha.extensions = new _extensions();
