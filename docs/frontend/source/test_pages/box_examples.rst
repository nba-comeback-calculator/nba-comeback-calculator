Box Directive Examples
===================

This page demonstrates the custom green-box and blue-box directives.

Green Box Example
----------------

.. green-box::

   This is content inside a green box. It has a light green background with
   dark grey text for good readability.

   - You can use **bold text**
   - You can use *italic text*
   - You can use ``code``
   - You can use lists

Blue Box Example
---------------

.. blue-box::

   This is content inside a blue box. It has a light blue background with
   dark grey text for good readability.

   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, 
   nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eu aliquam nisl
   nisl sit amet nisl.

Nested Content Example
---------------------

.. green-box::

   You can have complex content inside these boxes:

   .. code-block:: python

      def hello_world():
          print("Hello, world!")

   Or even tables:

   +------------+------------+-----------+
   | Header 1   | Header 2   | Header 3  |
   +============+============+===========+
   | body row 1 | column 2   | column 3  |
   +------------+------------+-----------+
   | body row 2 | column 2   | column 3  |
   +------------+------------+-----------+