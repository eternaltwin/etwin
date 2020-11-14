# typed: strict
# frozen_string_literal: true

module Etwin
  module Link
    # Metadata about a link/unlink action
    class LinkAction
      extend T::Helpers
      extend T::Sig

      final!

      sig(:final) { returns(Time) }
      attr_reader :time

      sig(:final) { returns(User::ShortUser) }
      attr_reader :user

      sig(:final) { params(time: Time, user: User::ShortUser).void }
      def initialize(time, user)
        @time = T.let(time, Time)
        @user = T.let(user, User::ShortUser)
        freeze
      end

      sig(:final) { params(other: BasicObject).returns(T::Boolean) }
      def ==(other)
        case other
        when LinkAction
          @time == other.time && @user == other.user
        else
          false
        end
      end

      sig(:final) { returns(Integer) }
      def hash
        [@time, @user].hash
      end

      # https://github.com/sorbet/sorbet/blob/master/rbi/stdlib/json.rbi#L194
      sig(:final) { params(opts: T.untyped).returns(String) }
      def to_json(opts = nil)
        JSON.generate(as_json, opts)
      end

      sig(:final) { returns(T::Hash[String, T.untyped]) }
      def as_json
        {
          'time' => @time,
          'user' => @user.as_json
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
            pp.text 'time='
            pp.pp @time
            pp.text ','
            pp.breakable ''
            pp.text 'user='
            pp.pp @user
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
          time = Time.iso8601(raw['time'])
          user = User::ShortUser.deserialize(raw['user'])
          new(time, user)
        end
      end
    end
  end
end
