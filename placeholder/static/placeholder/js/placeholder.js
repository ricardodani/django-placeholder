var PLACEHOLDER_TEXT_NODE_DATA_PREFIX = "placeholder:text:";
var PLACEHOLDER_INSTANCE_NODE_DATA_PREFIX = "placeholder:instance:meta:";
var PLACEHOLDER_OBJECTS_NODE_DATA_PREFIX = "placeholder:objects:meta:";

function list_node_comments(node, comments, recursive) {
    if (comments == null)
        var comments = []
    if (recursive == null)
        var recursive = true
    if (node != null) {
        if (document.ELEMENT_NODE == node.nodeType) {
            for (var i = 0; i < node.childNodes.length; i++) {
                var child = node.childNodes[i]
                if (document.COMMENT_NODE == child.nodeType) {
                    comments.push(child)
                }
                else if ((recursive) && (document.ELEMENT_NODE == child.nodeType)) {
                    list_node_comments(child, comments, recursive)
                }
            }
        }
        return comments
    }
}

function is_placeholder_text(node) {
    return (
        (node.nodeType == document.COMMENT_NODE) &&
        (node.data.search(PLACEHOLDER_TEXT_NODE_DATA_PREFIX) == 0))
}

function is_placeholder_instance(node) {
    return (
        (node.nodeType == document.COMMENT_NODE) &&
        (node.data.search(PLACEHOLDER_INSTANCE_NODE_DATA_PREFIX) == 0))
}


function is_placeholder_objects(node) {
    return (
        (node.nodeType == document.COMMENT_NODE) &&
        (node.data.search(PLACEHOLDER_OBJECTS_NODE_DATA_PREFIX) == 0))
}

function list_placeholder_text(element, recursive) {
    return jQuery.grep(list_node_comments(element, [], recursive), function (node, index) {
        return is_placeholder_text(node)
    })
}

function list_placeholder_instance(element, recursive) {
    return jQuery.grep(list_node_comments(element, [], recursive), function (node, index) {
        return is_placeholder_instance(node)
    })
}

function list_placeholder_objects(element, recursive) {
    return jQuery.grep(list_node_comments(element, [], recursive), function (node, index) {
        return is_placeholder_objects(node)
    })
}

(function ($) {
    $(function () {
        var placeholders_init = function () {
            $.each(list_placeholder_text(document.body), function () {
                var len = PLACEHOLDER_TEXT_NODE_DATA_PREFIX.length
                var ph_node = this
                var meta = jQuery.parseJSON(this.data.slice(len))
                var $this = $(this.parentNode)
                $this.attr("contenteditable", true)
                var get_text = function () {
                    return $this.text().replace(/^\s*/, "").replace(/\s*$/, "");
                }
                var original_text = get_text()
                var save = function () {
                    // trim the string
                    meta['value'] = get_text();
                    $.post("/placeholder/save/", meta, function () {
                        alert("Texto alterado com sucesso.")
                        original_text = meta['value']
                    })
                }
                var change = function () {
                    if (get_text() != original_text)
                        if (confirm("Salvar as alterações neste texto ?"))
                            save()
                        else {
                            $this.text(original_text)
                        }
                }
                $this.bind("blur", function ()  {
                    change()
                })
            })

            $.each(list_placeholder_instance(document.body), function () {
                var len = PLACEHOLDER_INSTANCE_NODE_DATA_PREFIX.length
                var ph_node = this
                var meta = jQuery.parseJSON(this.data.slice(len))
                var nodeinstancedata = this.previousSibling.data;
                var $this = $(this)
                var $element = $this.next();
                var $button = $('<a title="Placeholder" class="fancybox placeholder" data-fancybox-type="iframe">✎</a>');
                $button.attr({
                    'href': '/admin/' + meta.app_label + "/" + meta.model_name.toLowerCase() + "/" + meta.model_pk + '/?_popup=1'
                })
                var offset = $element.offset();
                $button.css(offset);
                $button.appendTo(document.body);
                $button.fancybox({
                    afterClose: function () {
                        $.get(location.href, function (source) {
//                            $element.remove();
                            source = source.split("<!--" + nodeinstancedata + "-->")[1];
                            source = source.split("<!--/" + nodeinstancedata + "-->")[0];
                            $element.remove();
                            $this.next().remove();
                            $this.after(source);
                            $this.remove();
                        });
//                        alert(666);
                    }
//                    helpers: {title: {type: 'over'}}
                });
            })

            $.each(list_placeholder_objects(document.body), function () {
                var len = PLACEHOLDER_OBJECTS_NODE_DATA_PREFIX.length
                var ph_node = this
                var nodeobjectsdata = this.data;
                var meta = jQuery.parseJSON(this.data.slice(len))
                var $this = $(this)
                var $element = $this.next();
                var $button = $('<a title="Placeholder" class="fancybox placeholder" data-fancybox-type="iframe">✎</a>');
                $button.attr({
                    'href': '/admin/' + meta.app_label + "/" + meta.model_name.toLowerCase() + '/?pop=1'
                });
                var offset = $element.offset();
                $button.css(offset);
                $button.appendTo(document.body);
                $button.fancybox({
                    afterClose: function () {
                        $.get(location.href, function (source) {
//                            $element.remove();
                            source = source.split("<!--" + nodeobjectsdata + "-->")[1];
                            source = source.split("<!--/placeholder:objects-->")[0];
                            $element.remove();
                            $this.next().remove();
                            $this.after(source);
                            $this.remove();
                        });
//                        alert(666);
                    }
//                    helpers: {title: {type: 'over'}}
                });
            })
//            $(".fancybox").fancybox();
        }

        $.getScript("/static/placeholder/js/jquery.hotkeys.js", function () {
            $(document).bind('keyup', 'ctrl+shift+x', function(){
//                if (confirm("Carregar edição de conteúdo ?"))
//                {
//                    var credentials = prompt("Usuário/Senha");
                    placeholders_init();
//                }
            });
        })

    })
})(jQuery)
