# frozen_string_literal: true

require 'etwin'
require 'resolv-replace'
require_relative './etwin_rb_example/version'

module EtwinRbExample
  module_function

  def main
    client = Etwin::Client::HttpEtwinClient.new(URI.parse("https://eternal-twin.net"))
    user = client.get_user(Etwin::Client::Auth::Guest, Etwin::User::UserId.new("9f310484-963b-446b-af69-797feec6813f"))
    pp user
  end
end
