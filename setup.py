from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="nba-comeback-calculator",
    version="0.1.0",
    author="NBA Comeback Calculator Contributors",
    author_email="noreply@github.com",
    description="Statistical analysis of NBA comebacks",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/nba-comeback-calculator/nba-comeback-calculator",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=[
        "numpy",
        "scipy",
        "pandas",
        "requests",
        "matplotlib",
        "tqdm",
    ],
)