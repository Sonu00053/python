from markupsafe import escape

class FormHelper:
    
    @staticmethod
    def form_label(text, for_id=None):
        """
        Generates <label> tag
        """
        for_attr = f' for="{for_id}"' if for_id else ""
        return f'<label{for_attr}>{escape(text)}</label>'
    

    @staticmethod
    def form_input(attrs: dict):
        """
        Generates <input> tag
        attrs: dictionary like {'type':'text','name':'name','value':'abc'}
        """
        attr_str = " ".join(
            f'{key}="{escape(str(value))}"' if not isinstance(value, bool) else f'{key}' 
            for key, value in attrs.items() if value is not None
        )
        return f'<input {attr_str}>'
    
    @staticmethod
    def form_open(action="", method="POST", extra_attrs=None):
        """
        Generates <form> tag like CI form_open
        action: form submit URL
        method: GET / POST
        extra_attrs: dict for extra HTML attributes
        """
        extra = ""
        if extra_attrs:
            extra = " " + " ".join(f'{k}="{escape(v)}"' for k,v in extra_attrs.items())
        return f'<form method="{method}" action="{escape(action)}"{extra}>'

    
    
    @staticmethod
    def form_close():
        """
        Generates </form> tag
        """
        return "</form>"
    
    @staticmethod
    def form_textarea(attrs: dict):
        """
        Generates <textarea> tag
        attrs: dictionary like {'name':'message','rows':5,'cols':30,'value':'abc'}
        """
        value = escape(attrs.pop("value", ""))
        attr_str = " ".join(
            f'{key}="{escape(str(value))}"' if not isinstance(value, bool) else f'{key}' 
            for key, value in attrs.items() if value is not None
        )
        return f'<textarea {attr_str}>{value}</textarea>'

    @staticmethod
    def form_select(name, options, selected_value=None, extra_attrs=None):
        """
        Generates <select> tag with options
        options: dict {value: display} or list of tuples [(value, display)]
        """
        extra = ""
        if extra_attrs:
            extra = " " + " ".join(f'{k}="{escape(v)}"' for k,v in extra_attrs.items())
        
        options_html = ""

        # Check if options is dict
        if isinstance(options, dict):
            items = options.items()
        else:
            items = options

        for value, display in items:
            selected_attr = ' selected' if str(value) == str(selected_value) else ''
            options_html += f'<option value="{escape(value)}"{selected_attr}>{escape(display)}</option>'
        
        return f'<select name="{escape(name)}"{extra}>{options_html}</select>'


    @staticmethod
    def form_checkbox(name, value, checked=False, extra_attrs=None):
        """
        Generates <input type="checkbox"> tag
        name: name of the checkbox field
        value: value of the checkbox
        checked: boolean to indicate if checkbox is checked
        extra_attrs: dict for extra HTML attributes
        """
        extra = ""
        if extra_attrs:
            extra = " " + " ".join(f'{k}="{escape(v)}"' for k,v in extra_attrs.items())
        
        checked_attr = ' checked' if checked else ''
        return f'<input type="checkbox" name="{escape(name)}" value="{escape(value)}"{checked_attr}{extra}>'
        
    @staticmethod
    def form_radio(name, value, checked=False, extra_attrs=None):
        """
        Generates <input type="radio"> tag
        name: name of the radio field
        value: value of the radio button
        checked: boolean to indicate if radio button is checked
        extra_attrs: dict for extra HTML attributes
        """
        extra = ""
        if extra_attrs:
            extra = " " + " ".join(f'{k}="{escape(v)}"' for k,v in extra_attrs.items())
        
        checked_attr = ' checked' if checked else ''
        return f'<input type="radio" name="{escape(name)}" value="{escape(value)}"{checked_attr}{extra}>'
        
    @staticmethod
    def form_submit(value="Submit", extra_attrs=None):
        """
        Generates <input type="submit"> tag
        value: text on the submit button
        extra_attrs: dict for extra HTML attributes
        """
        extra = ""
        if extra_attrs:
            extra = " " + " ".join(f'{k}="{escape(v)}"' for k,v in extra_attrs.items())
        
        return f'<input type="submit" value="{escape(value)}"{extra}>'