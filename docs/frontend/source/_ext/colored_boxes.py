"""
Sphinx extension for green-box and blue-box directives.
"""

from docutils import nodes
from docutils.parsers.rst import Directive, directives

class BoxDirective(Directive):
    """
    Base class for colored box directives.
    """
    has_content = True
    required_arguments = 0
    optional_arguments = 0
    final_argument_whitespace = True
    option_spec = {
        'class': directives.class_option,
    }

    def run(self):
        self.assert_has_content()
        text = '\n'.join(self.content)
        
        # Create a container node with appropriate classes
        container = nodes.container(text)
        container['classes'] = ['box-container', self.box_class]
        
        # Parse the content as rst and add to the container
        self.state.nested_parse(self.content, self.content_offset, container)
        
        return [container]


class GreenBoxDirective(BoxDirective):
    """
    Directive for green boxes.
    """
    box_class = 'green-box'


class BlueBoxDirective(BoxDirective):
    """
    Directive for blue boxes.
    """
    box_class = 'blue-box'


def setup(app):
    """
    Setup function for Sphinx extension.
    """
    # Add the custom CSS file
    app.add_css_file('css/colored_boxes.css')
    
    # Register directives
    app.add_directive('green-box', GreenBoxDirective)
    app.add_directive('blue-box', BlueBoxDirective)
    
    return {
        'version': '0.1',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }