# typed: strict
# frozen_string_literal: true

module Etwin
  module Link
    # Versioned Hammerfest link
    class VersionedHammerfestLink
      extend T::Helpers
      extend T::Sig

      final!

      sig(:final) { returns(T.nilable(HammerfestLink)) }
      attr_reader :current

      sig(:final) { returns(T::Array[HammerfestLink]) }
      attr_reader :old

      sig(:final) { params(current: T.nilable(HammerfestLink), old: T::Array[HammerfestLink]).void }
      def initialize(current, old)
        @current = T.let(current, T.nilable(HammerfestLink))
        @old = T.let(old.freeze, T::Array[HammerfestLink])
        freeze
      end

      sig(:final) { params(other: BasicObject).returns(T::Boolean) }
      def ==(other)
        case other
        when VersionedHammerfestLink
          @current == other.current && @old == other.old
        else
          false
        end
      end

      sig(:final) { returns(Integer) }
      def hash
        [@current, @old].hash
      end

      # https://github.com/sorbet/sorbet/blob/master/rbi/stdlib/json.rbi#L194
      sig(:final) { params(opts: T.untyped).returns(String) }
      def to_json(opts = nil)
        JSON.generate(as_json, opts)
      end

      sig(:final) { returns(T::Hash[String, T.untyped]) }
      def as_json
        {
          'current' => @current.nil? ? nil : @current.as_json,
          'old' => @old.map(&:as_json)
        }
      end

      sig(:final) { returns(String) }
      def inspect
        PP.singleline_pp(self, String.new)
      end

      sig(:final) { params(pp: T.untyped).returns(T.untyped) }
      def pretty_print(pp)  # rubocop:disable Metrics/MethodLength
        pp.group(0, "#{self.class.name}(", ')') do
          pp.nest 1 do
            pp.breakable ''
            pp.text 'current='
            pp.pp @current
            pp.text ','
            pp.breakable ''
            pp.text 'old='
            pp.pp @old
          end
          pp.breakable ''
        end
      end

      class << self
        extend T::Sig

        sig(:final) { params(json_str: String).returns(T.attached_class) }
        def from_json(json_str)
          deserialize JSON.parse(json_str)
        end

        sig(:final) { params(raw: T.untyped).returns(T.attached_class) }
        def deserialize(raw)
          raw_current = raw['current']
          current = raw_current.nil? ? nil : HammerfestLink.deserialize(raw_current)
          new(current, [])
        end
      end
    end
  end
end
