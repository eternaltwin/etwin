# Etwin client for ruby

## Installation

Add a dependency on the `etwin` gem.

- Either add `spec.add_runtime_dependency('etwin', '~> 0.0.3')` to your `*.gemspec`
- Or add `gem 'etwin', '~> 0.0.3'` to your `Gemfile`

And then run:

```
bundle install
```

## Usage

```ruby
require 'etwin'

# ...

client = Etwin::Client::HttpEtwinClient.new(URI.parse("https://eternal-twin.net"))
user = client.get_user(Etwin::Client::Auth::Guest, Etwin::User::UserId.new("9f310484-963b-446b-af69-797feec6813f"))
pp user
```

## Development

```
bundle install
bundle exec rubocop
bundle exec rspec
# bundle exec rake release
# bundle exec rake install
bundle exec srb tc
# gem build
# gem push ...
```
