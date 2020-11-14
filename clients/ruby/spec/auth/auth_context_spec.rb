# typed: false
# frozen_string_literal: true

RSpec.describe Etwin::Auth::AuthContext do  # rubocop:disable Metrics/BlockLength
  items = SerializationTestItem.from_test_dir(
    'auth/auth-context',
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
      ),
      'guest' => Etwin::Auth::GuestAuthContext.new(
        Etwin::Auth::AuthScope::Default
      )
    }
  )

  items.each do |item|
    it "reads #{item.name}" do
      actual = Etwin::Auth::AuthContext.from_json(item.json)
      expect(actual).to eq(item.value)
    end
  end
end
