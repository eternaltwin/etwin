# typed: false
# frozen_string_literal: true

RSpec.describe Etwin::User::ShortUser do
  items = SerializationTestItem.from_test_dir(
    'core/user/short-user',
    {
      'demurgos' => Etwin::User::ShortUser.new(
        Etwin::User::UserId.new('9f310484-963b-446b-af69-797feec6813f'),
        Etwin::User::UserDisplayNameVersions.new(
          Etwin::User::UserDisplayNameVersion.new(
            Etwin::User::UserDisplayName.new('Demurgos')
          )
        )
      )
    }
  )

  items.each do |item|
    it "reads #{item.name}" do
      actual = Etwin::User::ShortUser.from_json(item.json)
      expect(actual).to eq(item.value)
    end
  end
end
