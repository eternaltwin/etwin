# typed: strict
# frozen_string_literal: true

require 'faraday'
require 'json'
require 'pp'
require 'time'
require 'sorbet-runtime'

# Eternal-Twin types and client
module Etwin
  # class << self
  #   def get_user(name)
  #     "Hello, #{name}"
  #   end
  # end
end

require_relative './etwin/auth'
require_relative './etwin/client'
require_relative './etwin/core'
require_relative './etwin/hammerfest'
require_relative './etwin/link'
require_relative './etwin/twinoid'
require_relative './etwin/user'
require_relative './etwin/version'

require_relative './etwin/_auth'
