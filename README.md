# Bar Nuri GitHub Pages

## Preinstall Requirements

1. install ruby & gem (https://www.ruby-lang.org/en/downloads/)
2. install project dependencies
```bash
gem install jekyll bundler
bundle update
bundle install
```

## Local Running
```bash
# bundle exec jekyll serve --livereload # can stuck the browser
bundle exec jekyll serve --watch
```

## Using Docker

Building the Image :

`docker build -t my-blog .`

Running the container :

`docker run -d -p 4000:4000 -it --volume="$PWD:/srv/jekyll" --name "my_blog" my-blog:latest jekyll serve --watch`

## Using Docker Compose :

### Development :

You can run the app in development mode : (your changes will be reflected --watch moded)

Serve the site at http://localhost:4000 :

`docker-compose -f docker-compose-dev.yml up --build --remove-orphans`

### Production :

You can run the app in production mode : (your changes will be reflected --watch moded)

Serve the site at http://localhost:4000 :

`docker-compose -f docker-compose-prod.yml up --build --remove-orphans`

Stop the app :
`docker-compose -f docker-compose-prod.yml down`
Once everything is good and ready to go live -

`docker-compose -f docker-compose-prod.yml up --build --detach`
