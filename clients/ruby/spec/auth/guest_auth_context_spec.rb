# typed: false
# frozen_string_literal: true

RSpec.describe Etwin::Auth::GuestAuthContext do
  items = SerializationTestItem.from_test_dir(
    'auth/guest-auth-context',
    {
      'guest' => Etwin::Auth::GuestAuthContext.new(
        Etwin::Auth::AuthScope::Default
      )
    }
  )

  items.each do |item|
    it "reads #{item.name}" do
      actual = Etwin::Auth::GuestAuthContext.from_json(item.json)
      expect(actual).to eq(item.value)
    end
  end
end
