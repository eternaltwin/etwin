# typed: false
# frozen_string_literal: true

RSpec.describe Etwin::Link::LinkAction do
  items = SerializationTestItem.from_test_dir(
    'link/link-action',
    {
      'demurgos' => Etwin::Link::LinkAction.new(
        Time.utc(2017, 5, 25, 23, 12, 50, 1000),
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
      actual = Etwin::Link::LinkAction.from_json(item.json)
      expect(actual).to eq(item.value)
    end
  end
end
