# typed: false
# frozen_string_literal: true

RSpec.describe Etwin::Auth::UserAuthContext do
  items = SerializationTestItem.from_test_dir(
    'auth/user-auth-context',
    {
      'demurgos' => Etwin::Auth::UserAuthContext.new(
        Etwin::Auth::AuthScope::Default,
        Etwin::User::ShortUser.new(
          Etwin::User::UserId.new('9f310484-963b-446b-af69-797feec6813f'),
          Etwin::User::UserDisplayNameVersions.new(
            Etwin::User::UserDisplayNameVersion.new(
              Etwin::User::UserDisplayName.new('Demurgos')
            )
          )
        ),
        true
      )
    }
  )

  items.each do |item|
    it "reads #{item.name}" do
      actual = Etwin::Auth::UserAuthContext.from_json(item.json)
      expect(actual).to eq(item.value)
    end
  end
end
