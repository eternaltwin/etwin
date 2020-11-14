# typed: strict
# frozen_string_literal: true

require 'bundler/setup'
require 'etwin'
require 'sorbet-runtime'

RSpec.configure do |config|
  # Enable flags like --only-failures and --next-failure
  config.example_status_persistence_file_path = '.rspec_status'

  # Disable RSpec exposing methods globally on `Module` and `main`
  config.disable_monkey_patching!

  config.expect_with :rspec do |c|
    c.syntax = :expect
  end
end

class SerializationTestItem
  extend T::Helpers
  extend T::Generic
  extend T::Sig

  Value = type_member

  final!

  TEST_ROOT = T.let(Pathname.new('../../test-resources').freeze, Pathname)

  sig(:final) { returns(String) }
  attr_reader :name

  sig(:final) { returns(String) }
  attr_reader :json

  sig(:final) { returns(Value) }
  attr_reader :value

  sig(:final) { params(name: String, json: String, value: Value).void }
  def initialize(name, json, value)
    @name = T.let(name, String)
    @json = T.let(json, String)
    @value = T.let(value, Value)
    freeze
  end

  class << self
    extend T::Sig

    sig(:final) do
      type_parameters(:V)
        .params(group: String, values: T::Hash[String, T.type_parameter(:V)])
        .returns(T::Array[SerializationTestItem[T.type_parameter(:V)]])
    end
    def from_test_dir(group, values)  # rubocop:disable Metrics/AbcSize, Metrics/MethodLength
      group_path = TEST_ROOT + Pathname.new(group)
      actual_item_names = Set.new
      test_items = []
      Dir.children(group_path).each do |name|
        name = name.freeze
        item_path = group_path + Pathname.new(name)

        next if File.ftype(item_path) != 'directory' || name.start_with?('.')

        actual_item_names.add(name)
        value = values.fetch(name)
        value_path = item_path + Pathname('value.json')
        json = T.must(File.open(value_path, 'r:UTF-8', &:read))
        test_items << SerializationTestItem.new(name, json, value)
      end

      test_items
    end
  end
end
