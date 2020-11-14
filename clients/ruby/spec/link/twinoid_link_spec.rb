# typed: false
# frozen_string_literal: true

RSpec.describe Etwin::Link::TwinoidLink do  # rubocop:disable Metrics/BlockLength
  items = SerializationTestItem.from_test_dir(
    'link/twinoid-link',
    {
      'demurgos' => Etwin::Link::TwinoidLink.new(
        Etwin::Link::LinkAction.new(
          Time.utc(2020, 10, 26, 18, 53, 14, 493_000),
          Etwin::User::ShortUser.new(
            Etwin::User::UserId.new('9f310484-963b-446b-af69-797feec6813f'),
            Etwin::User::UserDisplayNameVersions.new(
              Etwin::User::UserDisplayNameVersion.new(
                Etwin::User::UserDisplayName.new('Demurgos')
              )
            )
          )
        ),
        nil,
        Etwin::Twinoid::ShortTwinoidUser.new(
          Etwin::Twinoid::TwinoidUserId.new('38'),
          Etwin::Twinoid::TwinoidUserDisplayName.new('Demurgos')
        )
      )
    }
  )

  items.each do |item|
    it "reads #{item.name}" do
      actual = Etwin::Link::TwinoidLink.from_json(item.json)
      expect(actual).to eq(item.value)
    end
  end
end
