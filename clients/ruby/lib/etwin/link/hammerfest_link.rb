# typed: strict
# frozen_string_literal: true

module Etwin
  module Link
    # Link to a Hammerfest user from an Eternal-Twin user
    class HammerfestLink
      extend T::Helpers
      extend T::Sig

      final!

      sig(:final) { returns(LinkAction) }
      attr_reader :link

      sig(:final) { returns(T.nilable(LinkAction)) }
      attr_reader :unlink

      sig(:final) { returns(Etwin::Hammerfest::ShortHammerfestUser) }
      attr_reader :user

      sig(:final) do
        params(link: LinkAction, unlink: T.nilable(LinkAction), user: Etwin::Hammerfest::ShortHammerfestUser).void
      end
      def initialize(link, unlink, user)
        @link = T.let(link, LinkAction)
        @unlink = T.let(unlink, T.nilable(LinkAction))
        @user = T.let(user, Etwin::Hammerfest::ShortHammerfestUser)
        freeze
      end

      sig(:final) { params(other: BasicObject).returns(T::Boolean) }
      def ==(other)
        case other
        when HammerfestLink
          @link == other.link && @unlink == other.unlink && @user == other.user
        else
          false
        end
      end

      sig(:final) { returns(Integer) }
      def hash
        [@link, @unlink, @user].hash
      end

      # https://github.com/sorbet/sorbet/blob/master/rbi/stdlib/json.rbi#L194
      sig(:final) { params(opts: T.untyped).returns(String) }
      def to_json(opts = nil)
        JSON.generate(as_json, opts)
      end

      sig(:final) { returns(T::Hash[String, T.untyped]) }
      def as_json
        {
          'link' => @link.as_json,
          'unlink' => @unlink.nil? ? nil : @unlink.as_json,
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
            pp.text 'link='
            pp.pp @link
            pp.text ','
            pp.breakable ''
            pp.text 'unlink='
            pp.pp @unlink
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
          link = LinkAction.deserialize(raw['link'])
          raw_unlink = raw['unlink']
          unlink = raw_unlink.nil? ? nil : LinkAction.deserialize(raw_unlink)
          user = Etwin::Hammerfest::ShortHammerfestUser.deserialize(raw['user'])
          new(link, unlink, user)
        end
      end
    end
  end
end
