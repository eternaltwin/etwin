# typed: false
# frozen_string_literal: true

RSpec.describe Etwin::Auth::AccessTokenAuthContext do # rubocop:disable Metrics/BlockLength
  items = SerializationTestItem.from_test_dir(
    'auth/access-token-auth-context',
    {
      'eternalfest-demurgos' => Etwin::Auth::AccessTokenAuthContext.new(
        Etwin::Auth::AuthScope::Default,
        Etwin::Oauth::ShortOauthClient.new(
          Etwin::Oauth::OauthClientId.new('d19e61a3-83d3-410f-84ec-49aaab841559'),
          Etwin::Oauth::OauthClientKey.new('eternalfest@clients'),
          Etwin::Oauth::OauthClientDisplayName.new('Eternalfest')
        ),
        Etwin::User::ShortUser.new(
          Etwin::User::UserId.new('9f310484-963b-446b-af69-797feec6813f'),
          Etwin::User::UserDisplayNameVersions.new(
            Etwin::User::UserDisplayNameVersion.new(
              Etwin::User::UserDisplayName.new('Demurgos')
            )
          )
        )
      )
    }
  )

  items.each do |item|
    it "reads #{item.name}" do
      actual = Etwin::Auth::AccessTokenAuthContext.from_json(item.json)
      expect(actual).to eq(item.value)
    end
  end
end
