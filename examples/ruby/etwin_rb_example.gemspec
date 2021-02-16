# frozen_string_literal: true

require_relative 'lib/etwin_rb_example/version'

Gem::Specification.new do |spec|
  spec.name          = "etwin_rb_example"
  spec.version       = EtwinRbExample::VERSION
  spec.authors       = ["Charles Samborski"]
  spec.email         = ["demurgos@demurgos.net"]

  spec.summary       = 'Ruby client for the Eternal-Twin API.'
  spec.description   = 'Ruby client for the Eternal-Twin API. Defines Etwin domain types and HTTP client.'
  spec.homepage      = 'https://gitlab.com/eternal-twin/etwin'
  spec.license       = 'AGPL-3.0-or-later'
  spec.required_ruby_version = Gem::Requirement.new(">= 2.3.0")

  spec.metadata['allowed_push_host'] = 'PRIVATE'

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata['source_code_uri'] = 'https://gitlab.com/eternal-twin/etwin'
  spec.metadata['changelog_uri'] = 'https://gitlab.com/eternal-twin/etwin'

  # Specify which files should be added to the gem when it is released.
  spec.files = Dir['README.md', 'lib/**/*']
  spec.bindir        = "exe"
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  spec.add_development_dependency('rake', '~> 13.0.3')
  spec.add_development_dependency('rspec', '~> 3.10.0')
  spec.add_development_dependency('rubocop', '~> 1.10.0')
  spec.add_development_dependency('rubocop-sorbet', '~> 0.5.1')
  spec.add_development_dependency('sorbet', '~> 0.5.6289')
  spec.add_runtime_dependency('sorbet-runtime', '~> 0.5.6289')
  spec.add_runtime_dependency('etwin', '~> 0.3.2')
end
