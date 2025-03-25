# Minimal makefile for Sphinx documentation
#

# You can set these variables from the command line, and also
# from the environment for the first two.
SPHINXOPTS    ?=
SPHINXBUILD   ?= sphinx-build
SOURCEDIR     = source
BUILDDIR      = ../../../GIT_NBACC_GITHUB_IO/docs
#BUILDDIR = build
ALLSPHINXOPTS = -b html

# Put it first so that "make" without argument is like "make help".
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: help Makefile
# Fail if BUILDDIR is empty or starts with /
ifeq ($(strip $(BUILDDIR)),)
    $(error BUILDDIR cannot be empty)
endif
ifneq ($(patsubst /%,,$(BUILDDIR)),$(BUILDDIR))
    $(error BUILDDIR cannot start with /)
endif

# Catch-all target: route all unknown targets to Sphinx using the new
# "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
%: Makefile
	rm -rf $(BUILDDIR)/*
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)
	rm -rf $(BUILDDIR)/doctrees
	mv $(BUILDDIR)/html/* $(BUILDDIR)
	rm -rf $(BUILDDIR)/html
	touch $(BUILDDIR)/.nojekyll
